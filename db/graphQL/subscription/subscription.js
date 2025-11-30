const { PubSub, withFilter } = require("graphql-subscriptions");
const { Room } = require("../../models");

const pubsub = new PubSub();

const DIRECT_MESSAGE_SENT = "DIRECT_MESSAGE_SENT";
const DIRECT_ROOM_UPDATED = "DIRECT_ROOM_UPDATED";

/**
 * Normalize a comment for GraphQL.
 */
const normalizeCommentForGraphQL = (commentDoc) => {
  if (!commentDoc) return null;

  const raw = commentDoc.toObject ? commentDoc.toObject() : commentDoc;
  const authorRaw = raw.author;
  const author =
    authorRaw && authorRaw.toObject ? authorRaw.toObject() : authorRaw;

  return {
    ...raw,
    id: raw.id || raw._id?.toString?.(),
    author: author
      ? {
          ...author,
          id: author.id || author._id?.toString?.(),
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

module.exports = {
  pubsub,
  withFilter,
  DIRECT_MESSAGE_SENT,
  DIRECT_ROOM_UPDATED,
  publishDirectMessage,
  publishDirectRoomUpdate,
  directMessageReceivedSubscription,
  directRoomUpdatedSubscription,
  normalizeCommentForGraphQL,
};
