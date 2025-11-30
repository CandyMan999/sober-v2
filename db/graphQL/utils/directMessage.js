const { Room } = require("../../models");

const populateDirectRoom = async (room) => {
  if (!room) return null;

  return Room.findById(room._id)
    .populate([{ path: "users", populate: "profilePic" }, { path: "lastMessage", populate: "author" }])
    .populate({
      path: "comments",
      populate: "author",
      options: { sort: { createdAt: 1 } },
    })
    .exec();
};

module.exports = { populateDirectRoom };
