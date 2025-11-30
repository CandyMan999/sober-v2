const {
  AuthenticationError,
  UserInputError,
} = require("apollo-server-express");

const { Room, User } = require("../../models");
const { populateDirectRoom, ensureSingleDirectRoom } = require("../utils/directMessage");

module.exports = {
  myDirectRoomsResolver: async (_, __, ctx) => {
    const me = ctx.currentUser;
    if (!me) throw new AuthenticationError("Not authenticated");

    const rooms = await Room.find({ isDirect: true, users: me._id })
      .sort({ lastMessageAt: -1 })
      .populate([
        { path: "users", populate: "profilePic" },
        { path: "lastMessage", populate: "author" },
      ])
      .exec();

    return rooms.map((room) => ({
      ...room.toObject(),
      id: room.id || room._id?.toString?.(),
      users: (room.users || []).filter(Boolean),
    }));
  },

  directRoomWithUserResolver: async (_, { userId }, ctx) => {
    const me = ctx.currentUser;
    if (!me) throw new AuthenticationError("Not authenticated");

    if (String(me._id) === String(userId)) {
      throw new UserInputError("Cannot start a DM with yourself.");
    }

    const targetUser = await User.findById(userId).populate("profilePic");
    if (!targetUser) {
      throw new UserInputError("User not found");
    }

    const room = await ensureSingleDirectRoom(me._id, targetUser._id);
    if (!room) {
      throw new Error("Unable to locate direct room for participants");
    }

    const populatedRoom = await populateDirectRoom(room);
    if (!populatedRoom) {
      throw new Error("Unable to load direct room");
    }

    return populatedRoom;
  },
};
