const { PubSub, withFilter } = require("apollo-server-express");
const { Room } = require("../../models");

const pubsub = new PubSub();

const DIRECT_MESSAGE_SENT = "DIRECT_MESSAGE_SENT";
const DIRECT_ROOM_UPDATED = "DIRECT_ROOM_UPDATED";

const publishDirectMessage = (comment) => {
  if (!comment) return;
  pubsub.publish(DIRECT_MESSAGE_SENT, {
    directMessageReceived: comment,
  });
};

const publishDirectRoomUpdate = (room) => {
  if (!room) return;
  pubsub.publish(DIRECT_ROOM_UPDATED, {
    directRoomUpdated: room,
  });
};

const directMessageReceivedSubscription = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(DIRECT_MESSAGE_SENT),
    async (payload, variables, { currentUser }) => {
      const message = payload?.directMessageReceived;
      const roomId = variables?.roomId;
      if (!message || !roomId || !currentUser?._id) return false;

      if (String(message.targetId) !== String(roomId)) return false;

      const isMember = await Room.exists({
        _id: roomId,
        users: currentUser._id,
      });

      return Boolean(isMember);
    }
  ),
};

const directRoomUpdatedSubscription = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(DIRECT_ROOM_UPDATED),
    (payload, _variables, { currentUser }) => {
      const room = payload?.directRoomUpdated;
      if (!room || !currentUser?._id) return false;

      return (room.users || []).some(
        (user) => String(user?._id || user?.id) === String(currentUser._id)
      );
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
};
