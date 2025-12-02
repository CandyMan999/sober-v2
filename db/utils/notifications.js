const Notification = require("../models/Notification");

const NotificationTypes = {
  COMMENT_ON_POST: "COMMENT_ON_POST",
  COMMENT_REPLY: "COMMENT_REPLY",
  COMMENT_LIKED: "COMMENT_LIKED",
  FLAGGED_POST: "FLAGGED_POST",
  BUDDY_NEAR_BAR: "BUDDY_NEAR_BAR",
};

const NotificationIntents = {
  OPEN_POST_COMMENTS: "OPEN_POST_COMMENTS",
  ACKNOWLEDGE: "ACKNOWLEDGE",
};

const createNotificationForUser = async ({
  userId,
  notificationId,
  type,
  title,
  description,
  intent,
  postId,
  commentId,
  createdAt,
}) => {
  if (!userId || !notificationId) return null;

  const setPayload = {
    type,
    title,
    description,
    intent,
    postId,
    commentId,
  };

  const doc = await Notification.findOneAndUpdate(
    { user: userId, notificationId },
    {
      $set: setPayload,
      $setOnInsert: {
        user: userId,
        notificationId,
        read: false,
        dismissed: false,
        createdAt: createdAt || new Date(),
      },
    },
    { new: true, upsert: true }
  );

  return doc;
};

module.exports = {
  NotificationTypes,
  NotificationIntents,
  createNotificationForUser,
};
