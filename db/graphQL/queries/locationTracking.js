const { AuthenticationError } = require("apollo-server-express");
const { Connection, User, City } = require("../../models");
const { getDistanceFromCoords } = require("../../utils/helpers");
const { findClosestCity } = require("../../utils/location");
const { sendPushNotifications } = require("../../utils/pushNotifications");
const {
  NotificationTypes,
  NotificationIntents,
  createNotificationForUser,
} = require("../../utils/notifications");

const { Expo } = require("expo-server-sdk");
const moment = require("moment");

let expo = new Expo();

require("dotenv").config();

/**
 * Helpers
 */

// Get user + days sober once per request
async function getSoberStats(token) {
  const user = await User.findOne({ token });
  const soberTime = user?.sobrietyStartAt;

  if (!soberTime) {
    console.log("time: ", soberTime);
    console.log("how many days; ", 0);
    return { user, soberTime: null, days: 0, hasSoberTime: false };
  }

  const now = moment();
  const b = moment(soberTime);
  const days = now.diff(b, "days");

  console.log("time: ", soberTime);
  console.log("how many days; ", days);

  return { user, soberTime, days, hasSoberTime: true };
}

// Schedule multiple notification bursts with Expo
function scheduleRepeatedPushes({
  token,
  title = "Stay focused",
  subtitle,
  count,
  intervalMs,
  buildBody, // (index) => string | Promise<string>
  data = {},
}) {
  for (let i = 0; i < count; i++) {
    setTimeout(async () => {
      try {
        const body = await buildBody(i);
        if (!body || typeof body !== "string") {
          console.error(
            "[Push] buildBody did not return a valid string body:",
            body
          );
          return;
        }

        const messages = [
          {
            to: token,
            sound: "default",
            title,
            subtitle,
            body, // ✅ guaranteed string
            data: {
              pushToken: token,
              ...data,
              message: body,
              subtitle,
              title,
            },
          },
        ];

        const chunks = expo.chunkPushNotifications(messages);

        for (const chunk of chunks) {
          try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log("[Push] ticketChunk:", ticketChunk);
          } catch (error) {
            console.error("[Push] Error sending notification chunk:", error);
          }
        }
      } catch (err) {
        console.error("[Push] Error in scheduled push:", err);
      }
    }, i * intervalMs);
  }
}

/**
 * Liquor message builders
 */
function buildLiquorPrimaryMessage(storeName, index, days) {
  const messages = [
    `Why are you at ${storeName}?, Are you fucking insane?`,
    `Do you really want to wake up hungover?`,
    `You are going to regret this! You are ${days} days sober, let's make ${
      days + 1
    }`,
    `Alcohol is nothing but poison, walk out of ${storeName} now!`,
    `DUI, CANCER, LIVER FAILURE, VIOLENCE, LOST MONEY, LOST TIME!`,
  ];

  return messages[index] || messages[0];
}

function buildLiquorSecondaryMessage(storeName, index, days) {
  const messages = [
    `I see you are at ${storeName}?, do you have a death wish?`,
    `Do you really want to start this cycle again? You are ${days} days sober, do you want it to be day 1 again?`,
    `Be strong hangovers are withdrawls, which can be lethal!`,
    `Nicely packaged poison, do you want success in life? Get out of ${storeName} now!`,
    `Sell your dreams for a buzz?, Short term thinking, take a moment to think what this is really going to mean!`,
  ];

  return messages[index] || messages[0];
}

/**
 * Bar message builders
 */
function buildBarPrimaryMessage(barName, index, days, hasSoberTime) {
  const baseMessages = [
    `Why are you at ${barName}? you better be eating!`,
    `Do you really want to wake up hungover?`,
    `It's just nicely packaged poison, everyone here is brain washed`,
  ];

  const altMessages = [
    `Why are you at ${barName}? you better be eating!`,
    `Do you really want to wake up hungover and throw away ${days.toString()} days of sobriety`,
    `It's just nicely packaged poison, everyone here is brain washed`,
  ];

  const messages = hasSoberTime ? altMessages : baseMessages;
  return messages[index] || messages[0];
}

function buildBarSecondaryMessage(barName, index) {
  const messages = [
    `I see you are at ${barName}? do you think hanging out at a bar is a smart idea?`,
    `If you hang around a barber shop long enough "aka ${barName}", eventually you will get a haircut`,
    `Take a second, is drinking an anesthetic going to improve this day?`,
  ];

  return messages[index] || messages[0];
}

const VENUE_TYPES = {
  BAR: "BAR",
  LIQUOR_STORE: "LIQUOR_STORE",
};

async function getBuddyTargets(userId) {
  if (!userId) return [];

  const userIdStr = userId.toString();

  const connections = await Connection.find({
    isBuddy: true,
    $or: [{ follower: userId }, { followee: userId }],
  })
    .populate("follower")
    .populate("followee");

  const buddies = new Map();

  for (const connection of connections) {
    const followerId = connection.follower?._id?.toString?.();
    const followeeId = connection.followee?._id?.toString?.();

    const buddy =
      followerId === userIdStr ? connection.followee : connection.follower;

    if (!buddy?._id) continue;
    if (buddy.notificationsEnabled === false) continue;

    const buddyIdStr = buddy._id.toString();

    if (!buddies.has(buddyIdStr)) {
      buddies.set(buddyIdStr, buddy);
    }
  }

  return Array.from(buddies.values());
}

async function notifyBuddiesOfVenue({ user, venueName, venueType }) {
  if (!user?._id || !venueName) return;

  const buddies = await getBuddyTargets(user._id);
  if (!buddies.length) return;

  const venueLabel =
    venueType === VENUE_TYPES.LIQUOR_STORE ? "Liquor store" : "Bar";
  const notificationType =
    venueType === VENUE_TYPES.LIQUOR_STORE
      ? NotificationTypes.BUDDY_NEAR_LIQUOR
      : NotificationTypes.BUDDY_NEAR_BAR;

  const title = `${user.username || "A buddy"} is at a ${venueLabel}`;
  const description = `${user.username || "A buddy"} was spotted at ${
    venueName || "a venue"
  } (${venueLabel}). Tap to check in.`;

  const pushPayloads = [];

  for (const buddy of buddies) {
    const notificationId = `${notificationType}-${user._id}-${Date.now()}`;

    await createNotificationForUser({
      userId: buddy._id,
      notificationId,
      type: notificationType,
      title,
      description,
      intent: NotificationIntents.OPEN_DIRECT_MESSAGE,
      fromUserId: user._id.toString(),
      fromUsername: user.username,
      fromProfilePicUrl: user.profilePicUrl,
      venueName,
      venueType,
    });

    if (buddy.token && Expo.isExpoPushToken(buddy.token)) {
      pushPayloads.push({
        pushToken: buddy.token,
        title,
        body: description,
        data: {
          type: notificationType,
          buddyId: user._id.toString(),
          buddyUsername: user.username,
          buddyProfilePicUrl: user.profilePicUrl,
          venueName,
          venueType,
        },
      });
    }
  }

  if (pushPayloads.length) {
    await sendPushNotifications(pushPayloads);
  }
}

module.exports = {
  getLiquorLocationResolver: async (root, args, ctx) => {
    const { lat, long, token, store } = args;
    let liquorData = [];

    try {
      const closestCity = await findClosestCity(lat, long);
      const city = closestCity
        ? await City.findById(closestCity._id).populate("liquor")
        : null;

      const { user, days } = await getSoberStats(token);

      if (!Expo.isExpoPushToken(token)) {
        console.error(`Push token ${token} is not a valid Expo push token`);
        // Still return data if needed
      }

      const results = city?.liquor || [];

      for (const result of results) {
        const distance = await getDistanceFromCoords(
          lat,
          long,
          result.lat,
          result.long
        );

        if (distance <= 100) {
          liquorData.push({
            name: result.name,
            lat: result.lat,
            long: result.long,
          });
        }
      }

      // if closest liquor store hasn't changed, don't spam notifications
      if (liquorData.length && store === liquorData[0].name) {
        return [];
      }

      if (liquorData.length && token && Expo.isExpoPushToken(token)) {
        const storeName = liquorData[0].name;

        scheduleRepeatedPushes({
          token,
          subtitle: storeName,
          count: 5, // same as before
          intervalMs: 10000, // 10 seconds
          title: "Warning",
          subtitle: `Spotted at liquor store: ${storeName}`,
          buildBody: async (index) => {
            const primary = buildLiquorPrimaryMessage(storeName, index, days);
            const secondary = buildLiquorSecondaryMessage(
              storeName,
              index,
              days
            );
            return Math.random() < 0.5 ? primary : secondary;
          },
          data: {
            type: "VENUE_WARNING",
            venueType: VENUE_TYPES.LIQUOR_STORE,
            venueName: storeName,
          },
        });

        await notifyBuddiesOfVenue({
          user,
          venueName: storeName,
          venueType: VENUE_TYPES.LIQUOR_STORE,
        });
      }

      return liquorData;
    } catch (err) {
      console.error("Liquor resolver error:", err);
      throw new AuthenticationError("Error finding liquor alert: " + err);
    }
  },

  getBarLocationResolver: async (root, args, ctx) => {
    const { lat, long, token, bar } = args;
    let barData = [];

    try {
      const closestCity = await findClosestCity(lat, long);
      const city = closestCity
        ? await City.findById(closestCity._id).populate("bars")
        : null;

      const { user, days, hasSoberTime } = await getSoberStats(token);

      if (!Expo.isExpoPushToken(token)) {
        console.error(`Push token ${token} is not a valid Expo push token`);
        // Still return data if needed
      }

      const results = city?.bars || [];

      for (const result of results) {
        const distance = await getDistanceFromCoords(
          lat,
          long,
          result.lat,
          result.long
        );

        if (distance <= 100) {
          barData.push({
            name: result.name,
            lat: result.lat,
            long: result.long,
          });
        }
      }

      // if closest bar hasn't changed, don't spam notifications
      if (barData.length && bar === barData[0].name) {
        return [];
      }

      if (barData.length && token && Expo.isExpoPushToken(token)) {
        const barName = barData[0].name;

        scheduleRepeatedPushes({
          token,
          subtitle: barName,
          count: 3, // same as before
          intervalMs: 20000, // 20 seconds
          title: "Warning",
          subtitle: `Spotted at bar: ${barName}`,
          buildBody: async (index) => {
            const primary = buildBarPrimaryMessage(
              barName,
              index,
              days,
              hasSoberTime
            );
            const secondary = buildBarSecondaryMessage(barName, index);
            return Math.random() < 0.5 ? primary : secondary;
          },
          data: {
            type: "VENUE_WARNING",
            venueType: VENUE_TYPES.BAR,
            venueName: barName,
          },
        });

        await notifyBuddiesOfVenue({
          user,
          venueName: barName,
          venueType: VENUE_TYPES.BAR,
        });
      }

      return barData;
    } catch (err) {
      console.error("Bar resolver error:", err);
      throw new AuthenticationError("Error finding bar alert: " + err);
    }
  },
};
