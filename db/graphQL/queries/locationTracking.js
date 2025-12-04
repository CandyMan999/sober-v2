const { AuthenticationError } = require("apollo-server-express");

const { User, City } = require("../../models");
const { getDistanceFromCoords } = require("../../utils/helpers");
const { findClosestCity } = require("../../utils/location");

const { Expo } = require("expo-server-sdk");
const moment = require("moment");

let expo = new Expo();

require("dotenv").config();

module.exports = {
  getLiquorLocationResolver: async (root, args, ctx) => {
    const { lat, long, token, store } = args;
    let liquorData = [];

    const closestCity = await findClosestCity(lat, long);
    const city = closestCity
      ? await City.findById(closestCity._id).populate("liquor")
      : null;

    const createMessage = async (store, index) => {
      const user = await User.findOne({ token });
      const soberTime = user?.sobrietyStartAt;
      let days = 0;

      console.log("time: ", soberTime);
      if (soberTime) {
        const now = moment();
        const b = moment(soberTime);
        days = now.diff(b, "days");
      }

      console.log("how many days; ", days);
      const MESSAGES = [
        `Why are you at ${store}?, Are you fucking insane?`,
        `Do you really want to wake up hungover?`,
        `You are going to regret this! You are ${days} days sober, let's make ${(days += 1)}`,
        `Alcohol is nothing but poison, walk out of ${store} now!`,
        `DUI, CANCER, LIVER FAILURE, VIOLENCE, LOST MONEY, LOST TIME!`,
      ];
      return MESSAGES[index];
    };

    // `Why are you at ${store}?, Are you fucking insane?`,
    //     `Do you really want to wake up hungover?`,
    //     `You are going to regret this!`,
    //     `Alcohol is nothing but poison, walk out of ${store} now!`,
    //     `DUI, CANCER, LIVER FAILURE, VIOLENCE, LOST MONEY, LOST TIME!`,

    // `I see you are at ${store}?, do you have a death wish?`,
    //     `Do you really want to start this cycle again?`,
    //     `Be strong hangovers are withdrawls, which can be lethal!`,
    //     `Nicely packaged poison, do you want success in life? Get out of ${store} now!`,
    //     `Sell your dreams for a buzz?, Short term thinking, take a moment to think what this is really going to mean!`,

    const createSecondaryMessage = async (store, index) => {
      const user = await User.findOne({ token });
      const soberTime = user?.sobrietyStartAt;
      let days = 0;

      console.log("time: ", soberTime);
      if (soberTime) {
        const now = moment();
        const b = moment(soberTime);
        days = now.diff(b, "days");
      }

      console.log("how many days; ", days);
      const MESSAGES = [
        `I see you are at ${store}?, do you have a death wish?`,
        `Do you really want to start this cycle again? You are ${days} sober, do you want it to be day 1 again?`,
        `Be strong hangovers are withdrawls, which can be lethal!`,
        `Nicely packaged poison, do you want success in life? Get out of ${store} now!`,
        `Sell your dreams for a buzz?, Short term thinking, take a moment to think what this is really going to mean!`,
      ];
      return MESSAGES[index];
    };

    try {
      if (!Expo.isExpoPushToken(token)) {
        console.error(`Push token ${token} is not a valid Expo push token`);
        return;
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
          liquorData = [
            ...liquorData,
            {
              name: result.name,
              lat: result.lat,
              long: result.long,
            },
          ];
        }
      }

      if (!!liquorData.length && store === liquorData[0].name) {
        return [];
      }

      if (!!liquorData.length && token) {
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            let messages = [];

            messages.push({
              to: token,
              sound: "default",
              title: "Sober Motivation",
              subtitle: liquorData[0].name,
              body: [
                createMessage(liquorData[0].name, i),
                createSecondaryMessage(liquorData[0].name, i),
              ][Math.floor(Math.random() * 2)],
              data: { pushToken: token },
            });

            let chunks = expo.chunkPushNotifications(messages);
            let tickets = [];
            (async () => {
              for (let chunk of chunks) {
                try {
                  let ticketChunk = await expo.sendPushNotificationsAsync(
                    chunk
                  );
                  console.log("ticketChunk: ", ticketChunk);
                  tickets.push(...ticketChunk);
                  // NOTE: If a ticket contains an error code in ticket.details.error, you
                  // must handle it appropriately. The error codes are listed in the Expo
                  // documentation:
                  // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
                } catch (error) {
                  console.error(error);
                }
              }
            })();

            let receiptIds = [];
            for (let ticket of tickets) {
              if (ticket.id) {
                receiptIds.push(ticket.id);
              }
            }

            let receiptIdChunks =
              expo.chunkPushNotificationReceiptIds(receiptIds);
            async () => {
              for (let chunk of receiptIdChunks) {
                try {
                  let receipts = await expo.getPushNotificationReceiptsAsync(
                    chunk
                  );
                  console.log(receipts);

                  for (let receiptId in receipts) {
                    let { status, message, details } = receipts[receiptId];
                    if (status === "ok") {
                      continue;
                    } else if (status === "error") {
                      console.error(
                        `There was an error sending a notification: ${message}`
                      );
                      if (details && details.error) {
                        // The error codes are listed in the Expo documentation:
                        // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
                        // You must handle the errors appropriately.
                        console.error(`The error code is ${details.error}`);
                      }
                    }
                  }
                } catch (error) {
                  console.error(error);
                }
              }
            };
          }, i * 10000);
        }
      }

      return liquorData;
    } catch (err) {
      throw new AuthenticationError("Error finding bar alert: ", err);
    }
  },
  getBarLocationResolver: async (root, args, ctx) => {
    const { lat, long, token, bar } = args;
    let barData = [];
    const closestCity = await findClosestCity(lat, long);
    const city = closestCity
      ? await City.findById(closestCity._id).populate("bars")
      : null;

    const createMessage = async (bar, index) => {
      const user = await User.findOne({ token });
      const soberTime = user?.sobrietyStartAt;
      let days = 0;

      console.log("time: ", soberTime);
      if (soberTime) {
        const now = moment();
        const b = moment(soberTime);
        days = now.diff(b, "days");
      }

      console.log("how many days; ", days);

      const MESSAGES = [
        `Why are you at ${bar}? you better be eating!`,
        `Do you really want to wake up hungover?`,
        `It's just nicely packaged poison, everyone here is brain washed`,
      ];

      const ALT = [
        `Why are you at ${bar}? you better be eating!`,
        `Do you really want to wake up hungover and throw away ${days.toString()} days of sobriety`,
        `It's just nicely packaged poison, everyone here is brain washed`,
      ];

      return soberTime ? ALT[index] : MESSAGES[index];
    };

    const createSecondaryMessage = (bar, index) => {
      const MESSAGES = [
        `I see you are at ${bar}? do you think hanging out at a bar is a smart idea?`,
        `If you hang around a barber shop long enough "aka ${bar}", eventually you will get a haircut`,
        `Take a second, is drinking an anesthetic going to improve this day?`,
      ];
      return MESSAGES[index];
    };

    try {
      if (!Expo.isExpoPushToken(token)) {
        console.error(`Push token ${token} is not a valid Expo push token`);
        return;
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
          barData = [
            ...barData,
            {
              name: result.name,
              lat: result.lat,
              long: result.long,
            },
          ];
        }
      }

      if (!!barData.length && bar === barData[0].name) {
        return [];
      }

      if (!!barData.length && token) {
        for (let i = 0; i < 3; i++) {
          setTimeout(async () => {
            let messages = [];

            messages.push({
              to: token,
              sound: "default",
              title: "Sober Motivation",
              subtitle: barData[0].name,
              body: [
                await createMessage(barData[0].name, i),
                await createSecondaryMessage(barData[0].name, i),
              ][Math.floor(Math.random() * 2)],
              data: { pushToken: token },
            });

            let chunks = expo.chunkPushNotifications(messages);
            let tickets = [];
            (async () => {
              for (let chunk of chunks) {
                try {
                  let ticketChunk = await expo.sendPushNotificationsAsync(
                    chunk
                  );
                  console.log("ticketChunk: ", ticketChunk);
                  tickets.push(...ticketChunk);
                  // NOTE: If a ticket contains an error code in ticket.details.error, you
                  // must handle it appropriately. The error codes are listed in the Expo
                  // documentation:
                  // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
                } catch (error) {
                  console.error(error);
                }
              }
            })();

            let receiptIds = [];
            for (let ticket of tickets) {
              if (ticket.id) {
                receiptIds.push(ticket.id);
              }
            }

            let receiptIdChunks =
              expo.chunkPushNotificationReceiptIds(receiptIds);
            async () => {
              for (let chunk of receiptIdChunks) {
                try {
                  let receipts = await expo.getPushNotificationReceiptsAsync(
                    chunk
                  );
                  console.log(receipts);

                  for (let receiptId in receipts) {
                    let { status, message, details } = receipts[receiptId];
                    if (status === "ok") {
                      continue;
                    } else if (status === "error") {
                      console.error(
                        `There was an error sending a notification: ${message}`
                      );
                      if (details && details.error) {
                        // The error codes are listed in the Expo documentation:
                        // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
                        // You must handle the errors appropriately.
                        console.error(`The error code is ${details.error}`);
                      }
                    }
                  }
                } catch (error) {
                  console.error(error);
                }
              }
            };
          }, i * 20000);
        }
      }

      return barData;
    } catch (err) {
      throw new AuthenticationError("Error finding bar alert: ", err);
    }
  },
};
