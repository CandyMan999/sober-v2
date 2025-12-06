const { normalizeCommentForGraphQL } = require("../subscription/subscription");

const normalizeUserForGraphQL = (userDoc) => {
  if (!userDoc) return null;

  const raw = userDoc.toObject ? userDoc.toObject() : userDoc;

  return {
    ...raw,
    id: raw.id || raw._id?.toString?.(),
  };
};

const normalizeRoomForGraphQL = (roomDoc) => {
  if (!roomDoc) return null;

  const raw = roomDoc.toObject ? roomDoc.toObject() : roomDoc;

  return {
    ...raw,
    id: raw.id || raw._id?.toString?.(),
    users: Array.isArray(raw.users)
      ? raw.users.map((user) => normalizeUserForGraphQL(user)).filter(Boolean)
      : [],
    lastMessage: raw.lastMessage
      ? normalizeCommentForGraphQL(raw.lastMessage)
      : null,
  };
};

module.exports = { normalizeUserForGraphQL, normalizeRoomForGraphQL };
