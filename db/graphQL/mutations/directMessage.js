// resolvers/directMessages.js
const {
  AuthenticationError,
  UserInputError,
} = require("apollo-server-express");
const { Room, User, Comment } = require("../models");

const directMessageResolvers = {
  Query: {
    async myDirectRooms(_, __, ctx) {
      const me = ctx.currentUser;
      if (!me) throw new AuthenticationError("Not authenticated");

      return Room.find({
        isDirect: true,
        users: me._id,
      })
        .sort({ lastMessageAt: -1 })
        .populate("users")
        .populate("lastMessage")
        .exec();
    },

    async directRoomWithUser(_, { userId }, ctx) {
      const me = ctx.currentUser;
      if (!me) throw new AuthenticationError("Not authenticated");

      return Room.findOne({
        isDirect: true,
        users: { $all: [me._id, userId], $size: 2 },
      })
        .populate("users")
        .populate("lastMessage")
        .exec();
    },
  },

  Mutation: {
    async sendDirectMessage(_, { recipientId, text, replyTo }, ctx) {
      const me = ctx.currentUser;
      if (!me) throw new AuthenticationError("Not authenticated");

      if (String(me._id) === String(recipientId)) {
        throw new UserInputError("Cannot send a DM to yourself.");
      }

      const recipient = await User.findById(recipientId);
      if (!recipient) {
        throw new UserInputError("Recipient not found.");
      }

      // 1. Find or create DM room
      let room = await Room.findOne({
        isDirect: true,
        users: { $all: [me._id, recipient._id], $size: 2 },
      });

      if (!room) {
        room = await Room.create({
          isDirect: true,
          users: [me._id, recipient._id],
          lastMessageAt: new Date(),
        });
      }

      // 2. Create the message as a Comment targeting this room
      const comment = await Comment.create({
        text,
        author: me._id,
        targetType: "ROOM",
        targetId: room._id,
        replyTo: replyTo || null,
      });

      // 3. Update lastMessage fields
      room.lastMessageAt = new Date();
      room.lastMessage = comment._id;
      await room.save();

      return Comment.findById(comment._id).populate("author").exec();
    },
  },
};

module.exports = directMessageResolvers;
