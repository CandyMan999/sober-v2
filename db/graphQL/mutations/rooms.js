const {
  AuthenticationError,
  UserInputError,
} = require("apollo-server-express");
const { Room, Comment, User } = require("../../models");
const { normalizeCommentForGraphQL } = require("../subscription/subscription");

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
    return existing;
  }

  const room = await Room.create({ name: trimmed, isDirect: false });
  return room;
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
    .populate("users")
    .populate({ path: "lastMessage", populate: { path: "author", populate: "profilePic" } });

  return updatedRoom;
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

  return normalizeCommentForGraphQL(populatedComment);
};

module.exports = {
  createRoomResolver,
  changeRoomResolver,
  createCommentResolver,
};
