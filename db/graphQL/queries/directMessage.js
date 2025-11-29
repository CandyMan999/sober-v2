// resolvers/directMessages.js
const {
  AuthenticationError,
  UserInputError,
} = require("apollo-server-express");

const { Room, User, Comment } = require("../models");

module.exports = {
  // QUERY: list all DM rooms for the current user
  myDirectRoomsResolver: async (_, __, ctx) => {
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

  // QUERY: get (or inspect) the DM room between current user and a specific user
  directRoomWithUserResolver: async (_, { userId }, ctx) => {
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

  // MUTATION: send a DM to a specific user (creates the room if needed)
  sendDirectMessageResolver: async (_, { recipientId, text, replyTo }, ctx) => {
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

    // 1. Find or create DM room between me + recipient
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

    // 2. Create the Comment as the DM message
    const comment = await Comment.create({
      text: text.trim(),
      author: me._id,
      targetType: "ROOM",
      targetId: room._id,
      replyTo: replyTo || null,
    });

    // 3. Update room metadata for inbox previews
    room.lastMessageAt = new Date();
    room.lastMessage = comment._id;
    await room.save();

    // 4. Return populated comment
    return Comment.findById(comment._id).populate("author").exec();
  },
};
