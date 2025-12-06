const { AuthenticationError, UserInputError } = require("apollo-server-express");
const { Room, Comment } = require("../../models");
const { normalizeCommentForGraphQL } = require("../subscription/subscription");
const { normalizeRoomForGraphQL } = require("../utils/normalize");

const getRoomsResolver = async (_, __, ctx) => {
  const me = ctx.currentUser;
  if (!me) throw new AuthenticationError("Not authenticated");

  const rooms = await Room.find({ isDirect: false })
    .sort({ createdAt: 1 })
    .populate({ path: "users", select: "username profilePic profilePicUrl" })
    .populate({ path: "lastMessage", populate: { path: "author", populate: "profilePic" } });

  return rooms.map((room) => normalizeRoomForGraphQL(room));
};

const getCommentsResolver = async (_, { roomId }, ctx) => {
  const me = ctx.currentUser;
  if (!me) throw new AuthenticationError("Not authenticated");
  if (!roomId) throw new UserInputError("Room ID is required");

  const room = await Room.findById(roomId);
  if (!room) throw new UserInputError("Room not found");

  const comments = await Comment.find({
    targetType: "ROOM",
    targetId: room._id,
  })
    .sort({ createdAt: 1 })
    .populate({ path: "author", populate: "profilePic" })
    .populate({ path: "replyTo", populate: { path: "author", populate: "profilePic" } })
    .exec();

  return comments.map((comment) => normalizeCommentForGraphQL(comment));
};

module.exports = { getRoomsResolver, getCommentsResolver };
