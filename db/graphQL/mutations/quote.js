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

    const normalizeForComparison = (input) =>
      (input || "")
        .toLowerCase()
        // Remove emoji and variation selectors
        .replace(/[\p{Emoji_Presentation}\p{Emoji}\u200d\ufe0f]/gu, "")
        .replace(/\s+/g, " ")
        .trim();

    const levenshteinDistance = (a, b) => {
      const aLen = a.length;
      const bLen = b.length;

      if (aLen === 0) return bLen;
      if (bLen === 0) return aLen;

      const matrix = Array.from({ length: aLen + 1 }, () =>
        Array(bLen + 1).fill(0)
      );

      for (let i = 0; i <= aLen; i += 1) {
        matrix[i][0] = i;
      }

      for (let j = 0; j <= bLen; j += 1) {
        matrix[0][j] = j;
      }

      for (let i = 1; i <= aLen; i += 1) {
        for (let j = 1; j <= bLen; j += 1) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;

          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost
          );
        }
      }

      return matrix[aLen][bLen];
    };

    const similarityScore = (a, b) => {
      const maxLen = Math.max(a.length, b.length) || 1;
      const distance = levenshteinDistance(a, b);
      return 1 - distance / maxLen;
    };

    try {
      const sanitizedNewQuote = normalizeForComparison(normalized);
      const existingQuotes = await Quote.find({}, "text");

      for (const existing of existingQuotes) {
        const sanitizedExisting = normalizeForComparison(existing?.text);

        if (!sanitizedExisting) {
          continue;
        }

        if (similarityScore(sanitizedNewQuote, sanitizedExisting) >= 0.8) {
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
