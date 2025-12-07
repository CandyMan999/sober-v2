const { AuthenticationError, UserInputError } = require("apollo-server-express");
const { Room, Comment, User } = require("../../models");
const { normalizeCommentForGraphQL } = require("../subscription/subscription");
const { normalizeRoomForGraphQL } = require("../utils/normalize");

const getRoomsResolver = async (_, __, ctx) => {
  const me = ctx.currentUser;
  if (!me) throw new AuthenticationError("Not authenticated");

  const rooms = await Room.find({ isDirect: false })
    .sort({ createdAt: 1 })
    .populate({
      path: "users",
      select: "username profilePic profilePicUrl chatRoomStyle",
    })
    .populate({
      path: "lastMessage",
      populate: { path: "author", populate: "profilePic" },
    });

  const styleTargets = rooms.flatMap((room) => [
    ...(room?.users || []),
    room?.lastMessage?.author,
  ]);

  await Promise.all(styleTargets.map((user) => User.ensureChatRoomStyle(user)));

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

  const authors = comments.flatMap((comment) => [
    comment?.author,
    comment?.replyTo?.author,
  ]);

  await Promise.all(authors.map((user) => User.ensureChatRoomStyle(user)));

  return comments.map((comment) => normalizeCommentForGraphQL(comment));
};

module.exports = { getRoomsResolver, getCommentsResolver };
