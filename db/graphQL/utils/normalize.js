const { normalizeCommentForGraphQL } = require("../subscription/subscription");

const resolveProfilePicUrl = (userDoc) => {
  if (!userDoc) return null;

  const raw = userDoc.toObject ? userDoc.toObject() : userDoc;
  return raw.profilePicUrl || raw.profilePic?.url || null;
};

const normalizeUserForGraphQL = (userDoc) => {
  if (!userDoc) return null;

  const raw = userDoc.toObject ? userDoc.toObject() : userDoc;

  const messageStyle =
    typeof raw.chatRoomStyle === "number"
      ? raw.chatRoomStyle
      : typeof raw.messageStyle === "number"
      ? raw.messageStyle
      : undefined;

  return {
    ...raw,
    id: raw.id || raw._id?.toString?.(),
    messageStyle,
    profilePicUrl: resolveProfilePicUrl(raw),
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
    comments: Array.isArray(raw.comments)
      ? raw.comments
          .map((comment) => normalizeCommentForGraphQL(comment))
          .filter(Boolean)
      : [],
  };
};

module.exports = { normalizeUserForGraphQL, normalizeRoomForGraphQL };
