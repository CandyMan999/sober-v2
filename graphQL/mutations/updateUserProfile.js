const { AuthenticationError } = require("apollo-server-express");

const { User } = require("../../db/models");

module.exports = {
  updateUserProfileResolver: async (
    _,
    { token, username, profilePicUrl, sobrietyStartAt, timezone }
  ) => {
    try {
      let user = await User.findOne({ token });

      if (!user) {
        user = new User({ token });
      }

      if (typeof username === "string") {
        user.username = username.trim();
      }

      if (typeof profilePicUrl === "string") {
        user.profilePicUrl = profilePicUrl;
      }

      if (typeof sobrietyStartAt === "string") {
        // Expecting ISO string from the client
        user.sobrietyStartAt = new Date(sobrietyStartAt);
      }

      if (typeof timezone === "string") {
        user.timezone = timezone;
      }

      await user.save();
      return user;
    } catch (err) {
      throw new AuthenticationError(err.message);
    }
  },
};
