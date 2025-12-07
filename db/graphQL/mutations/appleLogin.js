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
      let user;

      if (token) {
        // 1️⃣ Primary: find by token and attach appleId
        user = await User.findOneAndUpdate(
          { token },
          { $set: { appleId: sanitizedAppleId } },
          { new: true }
        );

        // 2️⃣ If no user by token, try by appleId and attach token
        if (!user) {
          user = await User.findOneAndUpdate(
            { appleId: sanitizedAppleId },
            { $set: { token } },
            { new: true }
          );
        }

        // 3️⃣ If still no user, create a new one with both
        if (!user) {
          user = await User.create({
            appleId: sanitizedAppleId,
            token,
          });
        }
      } else {
        // No token: fall back to appleId only
        user = await User.findOne({ appleId: sanitizedAppleId });

        if (!user) {
          user = await User.create({ appleId: sanitizedAppleId });
        }
      }

      await user.populate([
        "profilePic",
        "drunkPic",
        "savedPosts",
        "savedQuotes",
      ]);

      return serializeUser(user);
    } catch (err) {
      console.error("APPLE_LOGIN_ERROR:", err);
      throw new AuthenticationError("Failed to log in with Apple.");
    }
  },
};
