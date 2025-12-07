const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../../models");
const { serializeUser } = require("../../utils/serializeUser");

module.exports = {
  appleLoginResolver: async (_, { appleId, token }) => {
    if (!appleId) {
      throw new AuthenticationError("Apple ID is required");
    }

    const sanitizedAppleId = appleId.trim();

    try {
      let user = await User.findOne({ appleId: sanitizedAppleId });

      if (!user && token) {
        user = await User.findOne({ token });
      }

      if (!user) {
        user = new User({ appleId: sanitizedAppleId, token });
      } else {
        user.appleId = sanitizedAppleId;
        if (token) {
          user.token = token;
        }
      }

      await user.save();
      await user.populate(["profilePic", "drunkPic", "savedPosts", "savedQuotes"]);

      return serializeUser(user);
    } catch (err) {
      throw new AuthenticationError(err.message);
    }
  },
};
