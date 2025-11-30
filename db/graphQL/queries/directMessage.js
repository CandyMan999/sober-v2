// resolvers/directMessages.js
const {
  AuthenticationError,
  UserInputError,
} = require("apollo-server-express");

const { Room } = require("../../models");
const { populateDirectRoom } = require("../utils/directMessage");

module.exports = {
  // QUERY: list all DM rooms for the current user
  myDirectRoomsResolver: async (_, __, ctx) => {
    const me = ctx.currentUser;
    if (!me) throw new AuthenticationError("Not authenticated");

    const rooms = await Room.find({
      isDirect: true,
      users: me._id,
    })
      .sort({ lastMessageAt: -1 })
      .populate([
        { path: "users", populate: "profilePic" },
        { path: "lastMessage", populate: "author" },
      ])
      .exec();

    return rooms;
  },

  // QUERY: get (or inspect) the DM room between current user and a specific user
  directRoomWithUserResolver: async (_, { userId }, ctx) => {
    const me = ctx.currentUser;
    if (!me) throw new AuthenticationError("Not authenticated");

    if (String(me._id) === String(userId)) {
      throw new UserInputError("Cannot start a DM with yourself.");
    }

    let room = await Room.findOne({
      isDirect: true,
      users: { $all: [me._id, userId], $size: 2 },
    });

    if (!room) {
      const participantIds = [me._id, userId];
      room = await Room.create({
        isDirect: true,
        users: participantIds,
        lastMessageAt: new Date(),
      });
    }

    const populatedRoom = await populateDirectRoom(room);
    const sortedComments = [...(populatedRoom.comments || [])].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    return {
      ...populatedRoom.toObject(),
      comments: sortedComments,
    };
  },
};
