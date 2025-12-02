const { AuthenticationError } = require("apollo-server-express");

const { Notification, User } = require("../../models");

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
