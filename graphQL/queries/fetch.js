const { AuthenticationError } = require("apollo-server-express");

const { User, Picture } = require("../../db/models");

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
};
