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
        comments: sortedComments,
      };
    } catch (error) {
      console.error("directRoomWithUserResolver failed", error);
      throw error;
    }
  },
};
