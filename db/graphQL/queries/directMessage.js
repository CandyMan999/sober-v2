// resolvers/directMessages.js
const {
  AuthenticationError,
  UserInputError,
} = require("apollo-server-express");

const { Room, User, Comment } = require("../../models");
const {
  publishDirectMessage,
  publishDirectRoomUpdate,
} = require("../subscriptions");

const populateRoom = async (room) =>
  room
    .populate(["users", { path: "lastMessage", populate: "author" }])
    .populate({
      path: "comments",
      populate: "author",
      options: { sort: { createdAt: 1 } },
    });

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

    const populatedRoom = await populateRoom(room);
    const sortedComments = [...(populatedRoom.comments || [])].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    return {
      ...populatedRoom.toObject(),
      comments: sortedComments,
    };
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
    room.comments.push(comment._id);
    await room.save();

    // 4. Return populated comment
    const populatedComment = await Comment.findById(comment._id)
      .populate("author")
      .exec();

    publishDirectMessage(populatedComment);

    const hydratedRoom = await populateRoom(room);
    publishDirectRoomUpdate(hydratedRoom);

    return populatedComment;
  },
};
