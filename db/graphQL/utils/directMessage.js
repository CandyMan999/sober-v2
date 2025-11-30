const { Room } = require("../../models");

const normalizeIds = (ids = []) =>
  [...new Set(ids.map((value) => value?.toString()).filter(Boolean))];

const timestampValue = (room) => {
  if (!room) return 0;
  const candidates = [room.lastMessageAt, room.updatedAt, room.createdAt]
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((time) => !Number.isNaN(time));

  return candidates.length ? Math.max(...candidates) : 0;
};

const populateDirectRoom = async (room) => {
  if (!room) return null;

  return Room.findById(room._id)
    .populate([
      { path: "users", populate: "profilePic" },
      { path: "lastMessage", populate: "author" },
    ])
    .populate({
      path: "comments",
      populate: "author",
      options: { sort: { createdAt: 1 } },
    })
    .exec();
};

// Ensure there is exactly one DM room for the two users and normalize its membership
const ensureSingleDirectRoom = async (userAId, userBId) => {
  if (!userAId || !userBId) return null;

  const candidates = await Room.find({
    isDirect: true,
    users: { $in: [userAId, userBId] },
  })
    .sort({ updatedAt: -1 })
    .exec();

  const userA = userAId.toString();
  const userB = userBId.toString();

  let primary = null;
  let duplicates = [];

  candidates.forEach((room) => {
    const ids = normalizeIds(room.users);
    const hasBoth = ids.includes(userA) && ids.includes(userB);

    if (!primary && hasBoth) {
      primary = room;
      return;
    }

    if (hasBoth) {
      duplicates.push(room);
    }
  });

  if (!primary && candidates.length) {
    primary = candidates[0];
  }

  if (!primary) {
    primary = await Room.create({
      isDirect: true,
      users: [userAId, userBId],
      lastMessageAt: new Date(),
    });
  }

  // Treat the remaining candidates as duplicates to merge and delete
  duplicates = candidates.filter((room) => String(room._id) !== String(primary._id));

  // Normalize membership on the kept room
  primary.users = [userAId, userBId];

  // Merge duplicate room data into the primary room
  if (duplicates.length) {
    const mergedComments = normalizeIds([
      ...(primary.comments || []),
      ...duplicates.flatMap((room) => room.comments || []),
    ]);

    let latestRoom = primary;
    duplicates.forEach((room) => {
      if (timestampValue(room) > timestampValue(latestRoom)) {
        latestRoom = room;
      }
    });

    primary.comments = mergedComments;

    if (timestampValue(latestRoom) > timestampValue(primary)) {
      primary.lastMessageAt = latestRoom.lastMessageAt || latestRoom.updatedAt || latestRoom.createdAt;
      if (latestRoom.lastMessage) {
        primary.lastMessage = latestRoom.lastMessage;
      }
    }

    await Room.deleteMany({ _id: { $in: duplicates.map((room) => room._id) } });
  }

  if (!primary.lastMessageAt) {
    primary.lastMessageAt = primary.updatedAt || new Date();
  }

  await primary.save();

  return primary;
};

module.exports = { populateDirectRoom, ensureSingleDirectRoom };
