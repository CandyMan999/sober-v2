const { AuthenticationError, UserInputError } = require("apollo-server-express");

const { Connection, Quote, User } = require("../../models");
const { sendPushNotifications } = require("../../utils/pushNotifications");
const {
  NotificationTypes,
  NotificationIntents,
  createNotificationForUser,
} = require("../../utils/notifications");

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

    const tokenizeQuote = (input) => {
      const normalized = (input || "")
        .toLowerCase()
        // Remove emoji and variation selectors
        .replace(/[\p{Emoji_Presentation}\p{Emoji}\u200d\ufe0f]/gu, " ")
        // Drop punctuation and special characters so only words remain
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();

      return normalized ? normalized.split(" ") : [];
    };

    const similarityScore = (aTokens, bTokens) => {
      if (!aTokens.length || !bTokens.length) {
        return 0;
      }

      const buildFrequency = (tokens) => {
        const frequencies = {};
        for (const token of tokens) {
          frequencies[token] = (frequencies[token] || 0) + 1;
        }
        return frequencies;
      };

      const aFreq = buildFrequency(aTokens);
      const bFreq = buildFrequency(bTokens);

      let overlap = 0;
      for (const token of Object.keys(aFreq)) {
        if (bFreq[token]) {
          overlap += Math.min(aFreq[token], bFreq[token]);
        }
      }

      // Sørensen–Dice coefficient offers balanced weighting even when lengths differ
      return (2 * overlap) / (aTokens.length + bTokens.length);
    };

    try {
      const newQuoteTokens = tokenizeQuote(normalized);
      const existingQuotes = await Quote.find({}, "text");

      for (const existing of existingQuotes) {
        const existingTokens = tokenizeQuote(existing?.text);

        if (!existingTokens.length) {
          continue;
        }

        if (similarityScore(newQuoteTokens, existingTokens) >= 0.8) {
          throw new UserInputError(
            `A similar quote already exists: "${existing.text}"`
          );
        }
      }

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
              type: NotificationTypes.NEW_QUOTE,
              quoteId: String(quote._id),
              senderId: String(currentUser._id),
              senderUsername: senderName,
            },
          });

          await createNotificationForUser({
            userId: follower._id,
            notificationId: `quote-${quote._id}`,
            type: NotificationTypes.NEW_QUOTE,
            title: `${senderName} shared a new quote`,
            description: preview,
            intent: NotificationIntents.SHOW_INFO,
            quoteId: String(quote._id),
            createdAt: new Date(),
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
