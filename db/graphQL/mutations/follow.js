const { AuthenticationError } = require("apollo-server-express");
const { Connection, User } = require("../../models");
const { sendPushNotifications } = require("../../utils/pushNotifications");

const populateConnection = (query) =>
  query.populate("follower").populate("followee");

const followUserResolver = async (_, { token, userId }) => {
  const me = await User.findOne({ token });

  if (!me) {
    throw new AuthenticationError("Auth failed");
  }

  if (me._id.equals(userId)) {
    throw new Error("Can't follow yourself");
  }

  // Create the connection if it doesn't exist
  const connection = await populateConnection(
    Connection.findOneAndUpdate(
      { follower: me._id, followee: userId },
      { $setOnInsert: { isBuddy: false } },
      { upsert: true, new: true }
    )
  );

  // Check for a reverse connection to set buddy status
  const reverse = await Connection.findOne({
    follower: userId,
    followee: me._id,
  });

  if (reverse) {
    connection.isBuddy = true;
    reverse.isBuddy = true;
    await connection.save();
    await reverse.save();

    const buddyAlerts = [];
    const followerUser = connection.follower;
    const followeeUser = connection.followee;

    if (
      followeeUser?.token &&
      followeeUser?.notificationsEnabled !== false
    ) {
      buddyAlerts.push({
        pushToken: followeeUser.token,
        title: "You have a new sober buddy",
        body: `${followerUser?.username || "A member"} is now your accountability buddy—start a direct message!`,
        data: {
          type: "buddy_connection",
          followerId: String(followerUser?._id || ""),
          followeeId: String(followeeUser?._id || ""),
        },
      });
    }

    if (buddyAlerts.length) {
      await sendPushNotifications(buddyAlerts);
    }
  }

  return connection;
};

const unfollowUserResolver = async (_, { token, userId }) => {
  const me = await User.findOne({ token });

  if (!me) {
    throw new AuthenticationError("Auth failed");
  }

  await Connection.findOneAndDelete({ follower: me._id, followee: userId });

  const reverse = await Connection.findOne({
    follower: userId,
    followee: me._id,
  });

  if (reverse && reverse.isBuddy) {
    reverse.isBuddy = false;
    await reverse.save();
  }

  return true;
};

module.exports = { followUserResolver, unfollowUserResolver };
