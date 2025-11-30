const { PubSub, withFilter } = require("graphql-subscriptions");

const pubsub = new PubSub();

const DIRECT_MESSAGE_SENT = "DIRECT_MESSAGE_SENT";
const DIRECT_ROOM_UPDATED = "DIRECT_ROOM_UPDATED";

const publishDirectMessage = (comment) => {
  pubsub.publish(DIRECT_MESSAGE_SENT, {
    directMessageReceived: comment,
  });
};

const publishDirectRoomUpdate = (room) => {
  pubsub.publish(DIRECT_ROOM_UPDATED, {
    directRoomUpdated: room,
  });
};

module.exports = {
  pubsub,
  withFilter,
  DIRECT_MESSAGE_SENT,
  DIRECT_ROOM_UPDATED,
  publishDirectMessage,
  publishDirectRoomUpdate,
};
