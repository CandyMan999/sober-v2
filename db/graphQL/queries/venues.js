const { AuthenticationError } = require("apollo-server");
const { Venue, City } = require("../../models"); // Date + Token removed
const { Expo } = require("expo-server-sdk");
const moment = require("moment");
const { getDistanceFromCoords } = require("../../utils/helpers");

require("dotenv").config();

let expo = new Expo();

/** Helper: compute days sober */
const getDaysSober = (currentUser) => {
  if (!currentUser || !currentUser.sobrietyStartAt) return null;

  const now = moment();
  const start = moment(currentUser.sobrietyStartAt);
  return now.diff(start, "days");
};

module.exports = {
  /** -------- GET ALL VENUES -------- */
  getVenuesResolver: async () => {
    try {
      return await Venue.find();
    } catch (err) {
      throw new AuthenticationError(err.message);
    }
  },

  /** -------- LIQUOR STORE LOCATION CHECK -------- */
  getLiquorLocationResolver: async (root, args, ctx) => {
    const { lat, long, token, store } = args;
    const { currentUser } = ctx;

    let liquorData = [];
    const daysSober = getDaysSober(currentUser);

    const createMessage = (storeName, i) => {
      const BASE = [
        `Why are you at ${storeName}? Are you out of your mind?`,
        `Do you really want to wake up hungover again?`,
        `You are going to regret this.`,
        `Alcohol is poison — walk out of ${storeName} now.`,
        `Hangovers, regret, lost time — is it worth it?`,
      ];

      const ALT = [
        `Why are you at ${storeName}? You've been sober too long for this.`,
        `Throwing away ${daysSober} days for THIS?`,
        `Don't destroy progress you fought for.`,
        `Poison disguised as fun — walk out of ${storeName} now.`,
        `${daysSober} days sober → Don't trade it for regret.`,
      ];

      return daysSober ? ALT[i] : BASE[i];
    };

    const createSecondaryMessage = (storeName, i) => {
      const MSG = [
        `You don’t belong at ${storeName}.`,
        `Short-term relief = long-term damage.`,
        `You’re worth more than this cycle.`,
        `Walk away now before the craving wins.`,
        `Stop. Think. Breathe. Walk away.`,
      ];
      return MSG[i % MSG.length];
    };

    if (!Expo.isExpoPushToken(token)) return [];

    const findClosestCity = async () => {
      const cities = await City.find();
      let closest = null;

      for (const c of cities) {
        const dist = await getDistanceFromCoords(lat, long, c.lat, c.long);
        if (!closest || dist < closest.dist) closest = { id: c._id, dist };
      }

      return closest?.id;
    };

    const city = await City.findOne({ _id: await findClosestCity() }).populate(
      "liquor"
    );

    for (const location of city.liquor) {
      const dist = await getDistanceFromCoords(
        lat,
        long,
        location.lat,
        location.long
      );
      if (dist <= 100)
        liquorData.push({
          name: location.name,
          lat: location.lat,
          long: location.long,
        });
    }

    if (!liquorData.length || liquorData[0].name === store) return [];

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        sendPush(
          token,
          liquorData[0].name,
          createMessage,
          createSecondaryMessage,
          i
        );
      }, i * 10_000);
    }

    return liquorData;
  },

  /** -------- BAR LOCATION CHECK -------- */
  getBarLocationResolver: async (root, args, ctx) => {
    const { lat, long, token, bar } = args;
    const { currentUser } = ctx;

    let barData = [];
    const daysSober = getDaysSober(currentUser);

    const createMessage = (barName, i) => {
      const BASE = [
        `Why are you at ${barName}? You better be eating.`,
        `You know how this ends — regret.`,
        `Everyone here is numbing something. Don't join them.`,
      ];

      const ALT = [
        `You’ve survived ${daysSober} days — don’t restart the suffering.`,
        `Throwing away ${daysSober} days for a few hours?`,
        `You worked too hard to be back at ${barName}.`,
      ];

      return daysSober ? ALT[i] : BASE[i];
    };

    const createSecondaryMessage = (barName, i) => {
      const MSG = [
        `People don’t go to ${barName} to get better.`,
        `If you hang around a barbershop long enough, you get a haircut.`,
        `You don’t need alcohol — you need relief, peace, healing.`,
      ];
      return MSG[i % MSG.length];
    };

    if (!Expo.isExpoPushToken(token)) return [];

    const findClosestCity = async () => {
      const cities = await City.find();
      let closest = null;

      for (const c of cities) {
        const dist = await getDistanceFromCoords(lat, long, c.lat, c.long);
        if (!closest || dist < closest.dist) closest = { id: c._id, dist };
      }

      return closest?.id;
    };

    const city = await City.findOne({ _id: await findClosestCity() }).populate(
      "bars"
    );

    for (const location of city.bars) {
      const dist = await getDistanceFromCoords(
        lat,
        long,
        location.lat,
        location.long
      );
      if (dist <= 100)
        barData.push({
          name: location.name,
          lat: location.lat,
          long: location.long,
        });
    }

    if (!barData.length || barData[0].name === bar) return [];

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        sendPush(
          token,
          barData[0].name,
          createMessage,
          createSecondaryMessage,
          i
        );
      }, i * 20_000);
    }

    return barData;
  },

  /** -------- REGISTER TOKEN ONLY -------- */
  runPushResolver: async (_, { token }) => {
    if (!Expo.isExpoPushToken(token))
      throw new AuthenticationError("Invalid Expo push token");
    console.log("Token registered:", token);
    return token;
  },

  /** -------- ADD NEW VENUE -------- */
  addVenueResolver: async (_, { name, type, lat, long }) => {
    const cities = await City.find();
    let closest = null;

    for (const c of cities) {
      const dist = await getDistanceFromCoords(lat, long, c.lat, c.long);
      if (!closest || dist < closest.dist) closest = { id: c._id, dist };
    }

    const city = await City.findOne({ _id: closest.id });

    const newVenue = await Venue.create({ name, type, lat, long, city });

    await City.findByIdAndUpdate(
      city._id,
      { $push: { [type === "Bar" ? "bars" : "liquor"]: newVenue } },
      { new: true }
    );

    return newVenue;
  },
};

/** Utility to send push notifications */
async function sendPush(token, locationName, msgFn, secFn, index) {
  const body =
    Math.random() < 0.5
      ? msgFn(locationName, index)
      : secFn(locationName, index);

  const messages = [
    {
      to: token,
      sound: "default",
      title: "Sober Motivation",
      subtitle: locationName,
      body,
      data: { pushToken: token },
    },
  ];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) await expo.sendPushNotificationsAsync(chunk);
  } catch (err) {
    console.error("Push error:", err);
  }
}
