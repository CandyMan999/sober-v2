const populateDirectRoom = async (room) =>
  room
    .populate(["users", { path: "lastMessage", populate: "author" }])
    .populate({
      path: "comments",
      populate: "author",
      options: { sort: { createdAt: 1 } },
    });

module.exports = { populateDirectRoom };
