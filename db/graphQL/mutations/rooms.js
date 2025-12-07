const {
  AuthenticationError,
  UserInputError,
} = require("apollo-server-express");
const { Room, Comment, User } = require("../../models");
const {
  normalizeCommentForGraphQL,
  publishRoomComment,
  publishRoomsUpdated,
} = require("../subscription/subscription");
const { normalizeRoomForGraphQL } = require("../utils/normalize");
const {
  NotificationIntents,
  NotificationTypes,
  createNotificationForUser,
} = require("../../utils/notifications");
const { sendPushNotifications } = require("../../utils/pushNotifications");

const ALLOWED_ROOM_NAMES = ["General", "Early Days", "Relapse Support"];

const createRoomResolver = async (_, { name }, ctx) => {
  const me = ctx.currentUser;
  if (!me) throw new AuthenticationError("Not authenticated");
  if (!name || !name.trim()) throw new UserInputError("Room name is required");

  const trimmed = name.trim();

  if (ALLOWED_ROOM_NAMES.length && !ALLOWED_ROOM_NAMES.includes(trimmed)) {
    throw new UserInputError("Room name is not allowed");
  }
  const existing = await Room.findOne({ name: trimmed, isDirect: false });
  if (existing) {
    return normalizeRoomForGraphQL(existing);
  }

  const room = await Room.create({ name: trimmed, isDirect: false });
  return normalizeRoomForGraphQL(room);
};

const changeRoomResolver = async (_, { roomId, userId }, ctx) => {
  const me = ctx.currentUser;
  if (!me) throw new AuthenticationError("Not authenticated");
  if (!roomId) throw new UserInputError("Room ID is required");
  if (!userId) throw new UserInputError("User ID is required");
  if (String(userId) !== String(me._id)) {
    throw new AuthenticationError("Cannot change room for another user");
  }

  const room = await Room.findById(roomId);
  if (!room) throw new UserInputError("Room not found");

  await Room.updateMany(
    { isDirect: false, _id: { $ne: room._id } },
    { $pull: { users: me._id } }
  );

  const updatedRoom = await Room.findByIdAndUpdate(
    room._id,
    { $addToSet: { users: me._id } },
    { new: true }
  )
    .populate({ path: "users", select: "username profilePic profilePicUrl" })
    .populate({ path: "lastMessage", populate: { path: "author", populate: "profilePic" } });

  await publishRoomsUpdated();

  return normalizeRoomForGraphQL(updatedRoom);
};

const leaveAllRoomsResolver = async (_, { userId }, ctx) => {
  const me = ctx.currentUser;
  if (!me) throw new AuthenticationError("Not authenticated");
  if (!userId) throw new UserInputError("User ID is required");
  if (String(userId) !== String(me._id)) {
    throw new AuthenticationError("Cannot update another user");
  }

  await Room.updateMany({ isDirect: false }, { $pull: { users: me._id } });

  await publishRoomsUpdated();

  return true;
};

const createCommentResolver = async (
  _,
  { text, userId, roomId, replyToCommentId },
  ctx
) => {
  const me = ctx.currentUser;
  if (!me) throw new AuthenticationError("Not authenticated");
  if (!roomId) throw new UserInputError("Room ID is required");
  if (!text || !text.trim()) throw new UserInputError("Message text is required");
  if (!userId) throw new UserInputError("User ID is required");
  if (String(userId) !== String(me._id)) {
    throw new AuthenticationError("Cannot send as another user");
  }

  const room = await Room.findById(roomId);
  if (!room) throw new UserInputError("Room not found");

  const comment = await Comment.create({
    text: text.trim(),
    author: me._id,
    targetType: "ROOM",
    targetId: room._id,
    replyTo: replyToCommentId || null,
  });

  room.lastMessageAt = new Date();
  room.lastMessage = comment._id;
  room.comments = [...new Set([...(room.comments || []), comment._id])];
  await room.save();

  await User.findByIdAndUpdate(me._id, { $addToSet: { comments: comment._id } });

  const populatedComment = await Comment.findById(comment._id)
    .populate({ path: "author", populate: "profilePic" })
    .populate({ path: "replyTo", populate: { path: "author", populate: "profilePic" } });

  const normalized = normalizeCommentForGraphQL(populatedComment);

  if (replyToCommentId && populatedComment?.replyTo?.author) {
    const recipient = populatedComment.replyTo.author;
    const isSelf = String(recipient._id) === String(me._id);
    const actorName = me.username || "Someone";
    const trimmedBody = text.trim();
    const preview =
      trimmedBody.length > 140
        ? `${trimmedBody.slice(0, 137)}...`
        : trimmedBody;

    if (!isSelf && recipient.token && recipient.notificationsEnabled !== false) {
      await sendPushNotifications([
        {
          pushToken: recipient.token,
          title: `${actorName} replied in ${room.name}`,
          body: preview,
          data: {
            type: NotificationTypes.ROOM_REPLY,
            intent: NotificationIntents.OPEN_CHAT_ROOM,
            roomId: String(room._id),
            roomName: room.name,
            commentId: String(comment._id),
          },
        },
      ]);
    }

    if (!isSelf) {
      await createNotificationForUser({
        userId: recipient._id,
        notificationId: `room-reply-${comment._id.toString()}`,
        type: NotificationTypes.ROOM_REPLY,
        title: `${actorName} replied in ${room.name}`,
        description: preview,
        intent: NotificationIntents.OPEN_CHAT_ROOM,
        commentId: String(comment._id),
        fromUserId: String(me._id),
        fromUsername: actorName,
        fromProfilePicUrl: me.profilePicUrl || null,
        roomId: String(room._id),
        roomName: room.name,
        createdAt: comment.createdAt,
      });
    }
  }

  // Broadcast the new comment to any subscribers watching this room
  publishRoomComment(normalized);

  return normalized;
};

module.exports = {
  createRoomResolver,
  changeRoomResolver,
  createCommentResolver,
  leaveAllRoomsResolver,
};
