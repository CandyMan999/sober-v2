// resolvers/directMessages.js
const {
  AuthenticationError,
  UserInputError,
} = require("apollo-server-express");

const { Room, User } = require("../../models");
const { populateDirectRoom, ensureSingleDirectRoom } = require("../utils/directMessage");

module.exports = {
  // QUERY: list all DM rooms for the current user
  myDirectRoomsResolver: async (_, __, ctx) => {
    try {
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
    } catch (error) {
      console.error("myDirectRoomsResolver failed", error);
      throw error;
    }
  },

  // QUERY: get (or inspect) the DM room between current user and a specific user
  directRoomWithUserResolver: async (_, { userId }, ctx) => {
    try {
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
        console.error("Unable to populate direct room", { roomId: room?._id });
        throw new Error("Unable to load direct room");
      }

      const roomObject = populatedRoom.toObject ? populatedRoom.toObject() : populatedRoom;

      const sortedComments = [...(roomObject.comments || [])].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      return {
        ...roomObject,
        id: roomObject.id || roomObject._id?.toString?.(),
        users: (roomObject.users || []).filter((u) => u && (u.id || u._id)),
        comments: sortedComments,
      };
    } catch (error) {
      console.error("directRoomWithUserResolver failed", error);
      throw error;
    }
  },
};
