// resolvers/mutations/directMessages.js
const {
  AuthenticationError,
  UserInputError,
} = require("apollo-server-express");

const { Room, User, Comment } = require("../../models");
const {
  publishDirectMessage,
  publishDirectRoomUpdate,
  normalizeCommentForGraphQL,
} = require("../subscription/subscription");
const {
  populateDirectRoom,
  ensureSingleDirectRoom,
} = require("../utils/directMessage");

const sendDirectMessageResolver = async (
  _,
  { recipientId, text, replyTo },
  ctx
) => {
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

  const room = await ensureSingleDirectRoom(me._id, recipient._id);
  if (!room) {
    throw new Error("Unable to locate or create direct message room.");
  }

  const comment = await Comment.create({
    text: text.trim(),
    author: me._id,
    targetType: "ROOM",
    targetId: room._id,
    replyTo: replyTo || null,
  });

  room.lastMessageAt = new Date();
  room.lastMessage = comment._id;
  room.comments = [...new Set([...(room.comments || []), comment._id])];
  await room.save();

  const populatedComment = await Comment.findById(comment._id)
    .populate({ path: "author", populate: "profilePic" })
    .exec();

  const normalized = normalizeCommentForGraphQL(populatedComment);

  console.log("Comment to sub (normalized): ", normalized);

  publishDirectMessage(normalized);

  const hydratedRoom = await populateDirectRoom(room);
  if (hydratedRoom) {
    publishDirectRoomUpdate(hydratedRoom);
  }

  return normalized;
};

module.exports = { sendDirectMessageResolver };
