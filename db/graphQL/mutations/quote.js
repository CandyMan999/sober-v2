const { AuthenticationError, UserInputError } = require("apollo-server-express");

const { Quote } = require("../../models");

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
      return quote;
    } catch (err) {
      throw new Error(err.message);
    }
  },
};
