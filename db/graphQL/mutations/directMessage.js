// resolvers/mutations/directMessages.js
const {
  AuthenticationError,
  UserInputError,
} = require("apollo-server-express");

const { Room, User, Comment, Like } = require("../../models");
const {
  publishDirectMessage,
  publishDirectRoomUpdate,
  publishDirectTyping,
  normalizeCommentForGraphQL,
} = require("../subscription/subscription");
const {
  populateDirectRoom,
  ensureSingleDirectRoom,
} = require("../utils/directMessage");
const { sendPushNotifications } = require("../../utils/pushNotifications");

const sendDirectMessageResolver = async (
  _,
  { recipientId, text, replyTo },
  ctx
) => {
  const me = ctx.currentUser;
  if (!me) throw new AuthenticationError("Not authenticated");

  if (!text || !text.trim()) {
    throw new UserInputError("Message text is required.");
  }

  if (String(me._id) === String(recipientId)) {
    throw new UserInputError("Cannot send a DM to yourself.");
  }

  const recipient = await User.findById(recipientId);
  if (!recipient) {
    throw new UserInputError("Recipient not found.");
  }

  const room = await ensureSingleDirectRoom(me._id, recipient._id);
  if (!room) {
    throw new Error("Unable to locate or create direct message room.");
  }

  const comment = await Comment.create({
    text: text.trim(),
    author: me._id,
    targetType: "ROOM",
    targetId: room._id,
    replyTo: replyTo || null,
  });

  room.lastMessageAt = new Date();
  room.lastMessage = comment._id;
  room.comments = [...new Set([...(room.comments || []), comment._id])];
  await room.save();

  const populatedComment = await Comment.findById(comment._id)
    .populate({ path: "author", populate: "profilePic" })
    .exec();

  const normalized = normalizeCommentForGraphQL(populatedComment);

  console.log("Comment to sub (normalized): ", normalized);

  publishDirectMessage(normalized);

  const hydratedRoom = await populateDirectRoom(room);
  if (hydratedRoom) {
    publishDirectRoomUpdate(hydratedRoom);
  }

  if (recipient?.token && recipient?.notificationsEnabled !== false) {
    const trimmedBody = text.trim();
    const preview =
      trimmedBody.length > 140
        ? `${trimmedBody.slice(0, 137)}...`
        : trimmedBody;

    await sendPushNotifications([
      {
        pushToken: recipient.token,
        title: `${me.username || "Someone"} sent you a message`,
        body: preview,
        data: {
          type: "direct_message",
          roomId: String(room._id),
          senderId: String(me._id),
          senderUsername: me.username || "Someone",
          senderProfilePicUrl: me.profilePicUrl || null,
        },
      },
    ]);
  }

  return normalized;
};

const setDirectTypingResolver = async (_, { roomId, isTyping }, ctx) => {
  const me = ctx.currentUser;
  if (!me) throw new AuthenticationError("Not authenticated");

  if (!roomId) throw new UserInputError("Room ID is required.");

  const room = await Room.findById(roomId).populate("users");
  if (!room) throw new UserInputError("Room not found.");

  const isParticipant = room.users?.some(
    (user) => String(user._id || user.id) === String(me._id)
  );
  if (!isParticipant) throw new AuthenticationError("Not a participant");

  const typingPayload = {
    roomId: room._id.toString(),
    userId: me._id.toString(),
    username: me.username,
    profilePicUrl: me.profilePicUrl,
    isTyping: Boolean(isTyping),
    lastTypedAt: new Date().toISOString(),
  };

  publishDirectTyping(typingPayload);

  return typingPayload;
};

const deleteDirectRoomResolver = async (_, { roomId }, ctx) => {
  const me = ctx.currentUser;
  if (!me) throw new AuthenticationError("Not authenticated");

  if (!roomId) throw new UserInputError("Room ID is required.");

  const room = await Room.findById(roomId).populate("users");
  if (!room || !room.isDirect) {
    throw new UserInputError("Direct room not found.");
  }

  const isParticipant = room.users?.some(
    (user) => String(user._id || user.id) === String(me._id)
  );

  if (!isParticipant) {
    throw new AuthenticationError("Not a participant");
  }

  const commentsForRoom = await Comment.find({
    targetType: "ROOM",
    targetId: room._id,
  })
    .select("_id")
    .lean()
    .exec();

  const commentIds = Array.from(
    new Set(
      [
        ...(room.comments || []).map((commentId) => commentId?.toString?.()),
        ...commentsForRoom.map((comment) => comment._id?.toString?.()),
      ].filter(Boolean)
    )
  );

  if (commentIds.length) {
    await Like.deleteMany({ targetType: "COMMENT", targetId: { $in: commentIds } });
    await Comment.deleteMany({ _id: { $in: commentIds } });
  }

  await Room.deleteOne({ _id: room._id });

  return true;
};

module.exports = {
  sendDirectMessageResolver,
  setDirectTypingResolver,
  deleteDirectRoomResolver,
};
