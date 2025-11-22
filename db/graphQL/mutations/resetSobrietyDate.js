// resolvers/mutations/resetSobrietyDateResolver.js
const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../../models");

module.exports = {
  resetSobrietyDateResolver: async (_, { token, newStartAt }) => {
    try {
      const user = await User.findOne({ token });

      if (!user) {
        throw new AuthenticationError("User not found");
      }

      const now = new Date();
      const newStartRaw = new Date(newStartAt);

      if (Number.isNaN(newStartRaw.getTime())) {
        throw new AuthenticationError("Invalid date format for newStartAt");
      }

      const normalizeDay = (value) => {
        if (!value && value !== 0) return null;
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return null;
        d.setHours(0, 0, 0, 0);
        return d;
      };

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const newStartDay = normalizeDay(newStartRaw);

      // 1) Prevent future day
      if (newStartDay > today) {
        throw new AuthenticationError("Cannot set a future sobriety date.");
      }

      const streaks = Array.isArray(user.streaks) ? user.streaks : [];

      // 2) If there is a current streak, do NOT allow backdating before it.
      const currentStartDay = normalizeDay(user.sobrietyStartAt);
      if (currentStartDay && newStartDay < currentStartDay) {
        throw new AuthenticationError(
          "New sobriety start date cannot be earlier than your current streak start."
        );
      }

      // 3) If there is NO current streak, don't allow earlier than first recorded streak
      if (!currentStartDay && streaks.length > 0) {
        const pastStartDays = streaks
          .map((s) => normalizeDay(s.startAt))
          .filter(Boolean);

        if (pastStartDays.length > 0) {
          const earliestPastStartDay = new Date(
            Math.min(...pastStartDays.map((d) => d.getTime()))
          );
          if (newStartDay < earliestPastStartDay) {
            throw new AuthenticationError(
              "New sobriety start date conflicts with your recorded history (earlier than your first tracked streak)."
            );
          }
        }
      }

      // ==========================
      //  COMPUTE NEW START
      // ==========================

      // Align to chosen day, but use *current* time-of-day
      const newStart = new Date(newStartDay);
      newStart.setHours(
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds()
      );

      // ==========================
      //  CLOSE CURRENT STREAK (if any)
      // ==========================
      const previousStart = user.sobrietyStartAt
        ? new Date(user.sobrietyStartAt)
        : null;

      if (previousStart && !Number.isNaN(previousStart.getTime())) {
        user.streaks.push({
          startAt: previousStart,
          // 👇 picked date is now the end of the last streak
          endAt: newStart,
        });
      }

      // ==========================
      //  START NEW STREAK
      // ==========================
      // 👇 picked date is also the start of the new streak
      user.sobrietyStartAt = newStart;

      // Reset milestones so notifications can fire again for this new streak
      user.milestonesNotified = [];

      await user.save();
      return user;
    } catch (err) {
      throw new AuthenticationError(err.message);
    }
  },
};
