const { AuthenticationError, UserInputError } = require("apollo-server-express");

const { Connection, Quote, User } = require("../../models");
const { sendPushNotifications } = require("../../utils/pushNotifications");

module.exports = {
  addQuoteResolver: async (_, { text }, ctx) => {
    const { currentUser } = ctx || {};

    if (!currentUser) {
      throw new AuthenticationError("You must be signed in to add a quote");
    }

    const normalized = (text || "").trim();

    if (!normalized.length) {
      throw new UserInputError("Quote text is required");
    }

    if (normalized.length > 240) {
      throw new UserInputError("Quotes must be 240 characters or fewer");
    }

    try {
      const quote = await Quote.create({
        text: normalized,
        user: currentUser._id,
        isApproved: false,
        isUsed: false,
        likesCount: 0,
        commentsCount: 0,
      });

      await quote.populate("user");

      try {
        const sender = await User.findById(currentUser._id);
        const followerConnections = await Connection.find({
          followee: currentUser._id,
        }).populate("follower");

        const notifications = [];
        const senderName = sender?.username || "Someone";
        const preview = normalized.length > 140
          ? `${normalized.slice(0, 137)}...`
          : normalized;

        for (const connection of followerConnections) {
          const follower = connection?.follower;
          if (!follower?.token || follower?.notificationsEnabled === false) {
            continue;
          }

          notifications.push({
            pushToken: follower.token,
            title: `${senderName} shared a new quote`,
            body: preview,
            data: {
              type: "new_quote",
              quoteId: String(quote._id),
              senderId: String(currentUser._id),
              senderUsername: senderName,
            },
          });
        }

        if (notifications.length) {
          await sendPushNotifications(notifications);
        }
      } catch (notifyErr) {
        console.warn("Quote notification error", notifyErr?.message || notifyErr);
      }
      return quote;
    } catch (err) {
      throw new Error(err.message);
    }
  },
};
