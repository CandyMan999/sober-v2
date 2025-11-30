// resolvers/mutations/directMessages.js
const {
  AuthenticationError,
  UserInputError,
} = require("apollo-server-express");

const { Room, User, Comment } = require("../../models");
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

module.exports = { sendDirectMessageResolver, setDirectTypingResolver };
