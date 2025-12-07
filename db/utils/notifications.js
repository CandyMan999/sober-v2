const Notification = require("../models/Notification");

const NotificationTypes = {
  COMMENT_ON_POST: "COMMENT_ON_POST",
  COMMENT_REPLY: "COMMENT_REPLY",
  COMMENT_LIKED: "COMMENT_LIKED",
  FLAGGED_POST: "FLAGGED_POST",
  BUDDY_NEAR_BAR: "BUDDY_NEAR_BAR",
  BUDDY_NEAR_LIQUOR: "BUDDY_NEAR_LIQUOR",
  MILESTONE: "MILESTONE",
  FOLLOWING_NEW_POST: "FOLLOWING_NEW_POST",
  NEW_QUOTE: "new_quote",
  ROOM_REPLY: "ROOM_REPLY",
};

const NotificationIntents = {
  OPEN_POST_COMMENTS: "OPEN_POST_COMMENTS",
  ACKNOWLEDGE: "ACKNOWLEDGE",
  SHOW_INFO: "SHOW_INFO",
  OPEN_DIRECT_MESSAGE: "OPEN_DIRECT_MESSAGE",
  OPEN_CHAT_ROOM: "OPEN_CHAT_ROOM",
};

const createNotificationForUser = async ({
  userId,
  notificationId,
  type,
  title,
  description,
  intent,
  postId,
  quoteId,
  commentId,
  milestoneDays,
  milestoneTag,
  createdAt,
  fromUserId,
  fromUsername,
  fromProfilePicUrl,
  venueName,
  venueType,
  roomId,
  roomName,
}) => {
  if (!userId || !notificationId) return null;

  const setPayload = {
    type,
    title,
    description,
    intent,
    postId,
    quoteId,
    commentId,
    milestoneDays,
    milestoneTag,
    fromUserId,
    fromUsername,
    fromProfilePicUrl,
    venueName,
    venueType,
    roomId,
    roomName,
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
