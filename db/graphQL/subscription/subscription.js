const { PubSub, withFilter } = require("graphql-subscriptions");
const { Room } = require("../../models");

const pubsub = new PubSub();

const DIRECT_MESSAGE_SENT = "DIRECT_MESSAGE_SENT";
const DIRECT_ROOM_UPDATED = "DIRECT_ROOM_UPDATED";
const DIRECT_TYPING = "DIRECT_TYPING";
const ROOM_COMMENT_CREATED = "ROOM_COMMENT_CREATED";
const ROOMS_UPDATED = "ROOMS_UPDATED";

/**
 * Normalize a comment for GraphQL.
 */
const normalizeCommentForGraphQL = (commentDoc) => {
  if (!commentDoc) return null;

  const raw = commentDoc.toObject ? commentDoc.toObject() : commentDoc;
  const authorRaw = raw.author;
  const author =
    authorRaw && authorRaw.toObject ? authorRaw.toObject() : authorRaw;

  const authorStyle =
    typeof author?.chatRoomStyle === "number"
      ? author.chatRoomStyle
      : typeof author?.messageStyle === "number"
      ? author.messageStyle
      : undefined;

  return {
    ...raw,
    id: raw.id || raw._id?.toString?.(),
    author: author
      ? {
          ...author,
          id: author.id || author._id?.toString?.(),
          messageStyle: authorStyle,
        }
      : null,
  };
};

/**
 * Trigger subscription event when a message is created.
 */
const publishDirectMessage = (commentDoc) => {
  if (!commentDoc) return;

  const normalized = normalizeCommentForGraphQL(commentDoc);
  if (!normalized) return;

  pubsub.publish(DIRECT_MESSAGE_SENT, {
    directMessageReceived: normalized,
  });
};

/**
 * Trigger subscription event when room updates (lastMessage, etc.).
 */
const publishDirectRoomUpdate = (roomObject) => {
  if (!roomObject) return;

  pubsub.publish(DIRECT_ROOM_UPDATED, {
    directRoomUpdated: roomObject,
  });
};

/**
 * Trigger subscription event when a user is typing in a room.
 */
const publishDirectTyping = (typingPayload) => {
  if (!typingPayload?.roomId) return;

  pubsub.publish(DIRECT_TYPING, {
    directTyping: typingPayload,
  });
};

/**
 * Trigger subscription event when a room comment is created.
 */
const publishRoomComment = (commentDoc) => {
  if (!commentDoc) return;

  const normalized = normalizeCommentForGraphQL(commentDoc);
  if (!normalized) return;

  pubsub.publish(ROOM_COMMENT_CREATED, {
    roomCommentCreated: normalized,
  });
};

/**
 * Trigger subscription event when room rosters change.
 */
const publishRoomsUpdated = async () => {
  const { normalizeRoomForGraphQL } = require("../utils/normalize");
  const rooms = await Room.find({ isDirect: false })
    .populate({ path: "users", select: "username profilePicUrl" })
    .populate({ path: "lastMessage", populate: { path: "author" } });

  const normalizedRooms = rooms
    .map((room) => normalizeRoomForGraphQL(room))
    .filter(Boolean);

  pubsub.publish(ROOMS_UPDATED, {
    roomsUpdated: normalizedRooms,
  });
};

/**
 * Broadcast messages to anyone subscribed to that roomId.
 */
const directMessageReceivedSubscription = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(DIRECT_MESSAGE_SENT),
    (payload, variables) => {
      const message = payload?.directMessageReceived;
      const roomId = variables?.roomId;

      if (!message || !roomId) return false;

      // allow all clients subscribed to the room to receive updates
      return String(message.targetId) === String(roomId);
    }
  ),
};

/**
 * Broadcast room updates to anyone subscribed to it.
 */
const directRoomUpdatedSubscription = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(DIRECT_ROOM_UPDATED),
    (payload, variables) => {
      const room = payload?.directRoomUpdated;
      const roomId = variables?.roomId;

      if (!room || !roomId) return false;

      return String(room.id || room._id) === String(roomId);
    }
  ),
};

/**
 * Broadcast typing indicators to anyone subscribed to the room.
 */
const directTypingSubscription = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(DIRECT_TYPING),
    (payload, variables) => {
      const typing = payload?.directTyping;
      const roomId = variables?.roomId;

      if (!typing || !roomId) return false;

      return String(typing.roomId) === String(roomId);
    }
  ),
};

/**
 * Broadcast room comments to anyone subscribed to that room.
 */
const roomCommentCreatedSubscription = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(ROOM_COMMENT_CREATED),
    (payload, variables) => {
      const comment = payload?.roomCommentCreated;
      const roomId = variables?.roomId;

      if (!comment || !roomId) return false;

      return String(comment.targetId) === String(roomId);
    }
  ),
};

/**
 * Broadcast room roster changes to all subscribers.
 */
const roomsUpdatedSubscription = {
  subscribe: () => pubsub.asyncIterator(ROOMS_UPDATED),
};

module.exports = {
  pubsub,
  withFilter,
  DIRECT_MESSAGE_SENT,
  DIRECT_ROOM_UPDATED,
  DIRECT_TYPING,
  ROOM_COMMENT_CREATED,
  ROOMS_UPDATED,
  publishDirectMessage,
  publishDirectRoomUpdate,
  publishDirectTyping,
  publishRoomComment,
  publishRoomsUpdated,
  directMessageReceivedSubscription,
  directRoomUpdatedSubscription,
  directTypingSubscription,
  roomCommentCreatedSubscription,
  roomsUpdatedSubscription,
  normalizeCommentForGraphQL,
};
