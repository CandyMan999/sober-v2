const { AuthenticationError, UserInputError } = require("apollo-server-express");
const { User } = require("../../models");
const { serializeUser } = require("../../utils/serializeUser");

const VALID_PLAN_TYPES = ["Free", "Premium", "Unlimited"];

module.exports = {
  changePlanResolver: async (_, { userId, planType }) => {
    if (!userId) {
      throw new AuthenticationError("User ID is required");
    }

    if (!VALID_PLAN_TYPES.includes(planType)) {
      throw new UserInputError("Invalid plan type");
    }

    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new AuthenticationError("User not found");
      }

      const existingPlan =
        typeof user.plan?.toObject === "function"
          ? user.plan.toObject()
          : user.plan || {};

      const updatedPlan = {
        ...existingPlan,
        planType,
        withAds: planType === "Free",
      };

      user.plan = updatedPlan;
      await user.save();
      await user.populate(["profilePic", "drunkPic", "savedPosts", "savedQuotes"]);

      return serializeUser(user);
    } catch (err) {
      if (err instanceof AuthenticationError || err instanceof UserInputError) {
        throw err;
      }

      throw new AuthenticationError(err.message);
    }
  },
};
