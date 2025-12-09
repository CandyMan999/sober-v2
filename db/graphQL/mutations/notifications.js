const { AuthenticationError } = require("apollo-server-express");

const { Notification, User } = require("../../models");
const {
  NotificationCategories,
  normalizeNotificationSettings,
} = require("../../utils/notificationSettings");
const { serializeUser } = require("../../utils/serializeUser");

const getUserFromToken = async (token) => {
  if (!token) {
    throw new AuthenticationError("Token is required");
  }

  const user = await User.findOne({ token });

  if (!user) {
    throw new AuthenticationError("User not found");
  }

  return user;
};

const upsertNotificationStatus = async (userId, notificationId, updates = {}) => {
  const { read, dismissed, ...rest } = updates;

  const setPayload = {
    ...rest,
  };

  if (typeof read === "boolean") setPayload.read = read;
  if (typeof dismissed === "boolean") setPayload.dismissed = dismissed;

  return Notification.findOneAndUpdate(
    { user: userId, notificationId },
    {
      $set: setPayload,
      $setOnInsert: {
        user: userId,
        notificationId,
        createdAt: new Date(),
      },
    },
    { new: true, upsert: true }
  );
};

module.exports = {
  updateNotificationSettingsResolver: async (_, { token, input }) => {
    const user = await getUserFromToken(token);

    const settings = normalizeNotificationSettings(user);

    if (typeof input?.allPushEnabled === "boolean") {
      settings.allPushEnabled = input.allPushEnabled;
    }
    if (typeof input?.otherUserMilestones === "boolean") {
      settings.otherUserMilestones = input.otherUserMilestones;
    }
    if (typeof input?.otherUserComments === "boolean") {
      settings.otherUserComments = input.otherUserComments;
    }
    if (typeof input?.followingPosts === "boolean") {
      settings.followingPosts = input.followingPosts;
    }
    if (typeof input?.buddiesNearVenue === "boolean") {
      settings.buddiesNearVenue = input.buddiesNearVenue;
    }
    if (typeof input?.dailyPush === "boolean") {
      settings.dailyPush = input.dailyPush;
    }
    if (typeof input?.locationTrackingEnabled === "boolean") {
      settings.locationTrackingEnabled = input.locationTrackingEnabled;
    }

    user.notificationSettings = settings;
    await user.save();

    return serializeUser(user);
  },

  toggleNotificationCategoryResolver: async (
    _,
    { token, category, enabled }
  ) => {
    const user = await getUserFromToken(token);

    const settings = normalizeNotificationSettings(user);
    const enabledValue = Boolean(enabled);

    switch (category) {
      case NotificationCategories.OTHER_USER_MILESTONES:
        settings.otherUserMilestones = enabledValue;
        break;
      case NotificationCategories.OTHER_USER_COMMENTS:
        settings.otherUserComments = enabledValue;
        break;
      case NotificationCategories.FOLLOWING_POSTS:
        settings.followingPosts = enabledValue;
        break;
      case NotificationCategories.BUDDIES_NEAR_VENUE:
        settings.buddiesNearVenue = enabledValue;
        break;
      case NotificationCategories.DAILY_PUSH:
        settings.dailyPush = enabledValue;
        break;
      default:
        settings.allPushEnabled = enabledValue;
        break;
    }

    user.notificationSettings = settings;
    await user.save();

    return normalizeNotificationSettings(user);
  },

  markNotificationReadResolver: async (_, { token, id }) => {
    const user = await getUserFromToken(token);

    return upsertNotificationStatus(user._id, id, { read: true });
  },

  dismissNotificationResolver: async (_, { token, id }) => {
    const user = await getUserFromToken(token);

    return upsertNotificationStatus(user._id, id, { read: true, dismissed: true });
  },

  clearAllNotificationsResolver: async (_, { token, ids }) => {
    const user = await getUserFromToken(token);

    if (!Array.isArray(ids) || ids.length === 0) {
      return true;
    }

    await Notification.updateMany(
      { user: user._id, notificationId: { $in: ids } },
      { $set: { read: true, dismissed: true } }
    );

    const existingStatuses = await Notification.find({
      user: user._id,
      notificationId: { $in: ids },
    }).select("notificationId");
    const existingIds = new Set(existingStatuses.map((status) => status.notificationId));

    const missing = ids
      .filter((id) => !existingIds.has(id))
      .map((id) => ({
        user: user._id,
        notificationId: id,
        read: true,
        dismissed: true,
      }));

    if (missing.length) {
      try {
        await Notification.insertMany(missing, { ordered: false });
      } catch (err) {
        if (err?.code !== 11000) {
          throw err;
        }
      }
    }

    return true;
  },
};
