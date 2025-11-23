const { AuthenticationError } = require("apollo-server-express");

const { User, Quote } = require("../../models");

require("dotenv").config();

module.exports = {
  fetchMeResolver: async (root, args, ctx) => {
    const { token } = args;

    try {
      const user = await User.findOne({ token }).populate("profilePic");
      if (!user) {
        throw new AuthenticationError("User not found");
      }
      return user;
    } catch (err) {
      throw new AuthenticationError(err.message);
    }
  },
  getQuotesResolver: async (root, args, ctx) => {
    try {
      const quotes = await Quote.find({ isApproved: true })
        .populate("user")
        .populate({
          path: "comments",
          populate: [
            { path: "author" }, // comment.author -> User
            {
              path: "replies", // comment.replies -> [Comment]
              populate: { path: "author" }, // each reply.author -> User
            },
          ],
        });
      // Don't throw if none; just return empty array
      return quotes;
    } catch (err) {
      throw new Error(err.message);
    }
  },
};
