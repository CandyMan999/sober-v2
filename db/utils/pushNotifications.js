const { Expo } = require("expo-server-sdk");

const expo = new Expo();

const sendPushNotifications = async (notifications = []) => {
  if (!Array.isArray(notifications) || notifications.length === 0) return;

  const messages = [];

  for (const notification of notifications) {
    const { pushToken, title, body, data, icon, image, badge } = notification;

    if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
      console.warn(`Skipping invalid Expo push token: ${pushToken}`);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: "default",
      title,
      body,
      data: data || {},
      ...(icon ? { icon } : {}),
      ...(image ? { image } : {}),
      ...(badge ? { badge } : {}),
    });
  }

  if (!messages.length) return;

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error("Error sending push notification chunk", error);
    }
  }
};

module.exports = {
  sendPushNotifications,
};
