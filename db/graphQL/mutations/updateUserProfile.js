const { AuthenticationError } = require("apollo-server-express");

const { User } = require("../../models");

module.exports = {
  updateUserProfileResolver: async (
    _,
    {
      token,
      username,
      profilePicUrl,
      sobrietyStartAt,
      timezone,
      lat,
      long,
      whyStatement,
    }
  ) => {
    try {
      let user = await User.findOne({ token });

      if (!user) {
        user = new User({ token });
      }

      if (typeof username === "string") {
        const trimmedUsername = username.trim();

        if (trimmedUsername) {
          const duplicateUser = await User.findOne({
            username: trimmedUsername,
            _id: { $ne: user._id },
          });

          if (duplicateUser) {
            throw new AuthenticationError("That username is already taken. Pick another.");
          }

          user.username = trimmedUsername;
        }
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

      if (typeof lat === "number") {
        user.lat = lat;
      }

      if (typeof long === "number") {
        user.long = long;
      }

      if (typeof whyStatement === "string") {
        user.whyStatement = whyStatement.trim();
      }

      await user.save();
      return user;
    } catch (err) {
      throw new AuthenticationError(err.message);
    }
  },
};
