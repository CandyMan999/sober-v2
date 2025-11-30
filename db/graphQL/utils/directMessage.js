const mongoose = require("mongoose");
const { Room } = require("../../models");

const normalizeIds = (ids = []) =>
  [...new Set(ids.map((value) => value?.toString()).filter(Boolean))];

// Ensure we only keep one direct room per participant pair
const ensureSingleDirectRoom = async (userAId, userBId) => {
  const participants = normalizeIds([userAId, userBId]);
  if (participants.length < 2) return null;

  const rooms = await Room.find({
    isDirect: true,
    users: { $all: participants },
  })
    .sort({ updatedAt: -1 })
    .exec();

  let primary = rooms[0];
  const duplicates = rooms.slice(1).map((room) => room._id);

  if (!primary) {
    primary = await Room.create({
      isDirect: true,
      users: participants,
      comments: [],
      lastMessageAt: new Date(),
    });
  } else {
    const memberStrings = normalizeIds(primary.users);
    const missing = participants.filter((id) => !memberStrings.includes(id));

    if (missing.length || !primary.isDirect) {
      primary.users = participants.map((id) => mongoose.Types.ObjectId(id));
      primary.isDirect = true;
      if (!primary.lastMessageAt) {
        primary.lastMessageAt = primary.updatedAt || new Date();
      }
      await primary.save();
    }
  }

  if (duplicates.length) {
    await Room.deleteMany({ _id: { $in: duplicates } });
  }

  return primary;
};

const populateDirectRoom = async (room) => {
  if (!room) return null;

  const populated = await Room.findById(room._id)
    .populate([{ path: "users", populate: "profilePic" }, { path: "lastMessage", populate: "author" }])
    .populate({
      path: "comments",
      populate: [
        { path: "author", model: "User", populate: "profilePic" },
        { path: "replyTo", populate: { path: "author", model: "User" } },
      ],
    })
    .exec();

  if (!populated) return null;

  const roomObject = populated.toObject ? populated.toObject() : populated;

  const safeUsers = (roomObject.users || [])
    .filter(Boolean)
    .map((user) => {
      const userObj = user.toObject ? user.toObject() : user;
      return { ...userObj, id: userObj.id || userObj._id?.toString?.() };
    })
    .filter((user) => Boolean(user.id));

  if (safeUsers.length < 2) {
    return null;
  }

  const safeComments = (roomObject.comments || [])
    .filter((comment) => comment && comment.author)
    .map((comment) => {
      const commentObj = comment.toObject ? comment.toObject() : comment;
      const author = commentObj.author?.toObject
        ? commentObj.author.toObject()
        : commentObj.author;

      return {
        ...commentObj,
        id: commentObj.id || commentObj._id?.toString?.(),
        author: author
          ? { ...author, id: author.id || author._id?.toString?.() }
          : null,
      };
    })
    .filter((comment) => comment.author && comment.author.id);

  return {
    ...roomObject,
    id: roomObject.id || roomObject._id?.toString?.(),
    users: safeUsers,
    comments: safeComments,
  };
};

module.exports = { populateDirectRoom, ensureSingleDirectRoom };
