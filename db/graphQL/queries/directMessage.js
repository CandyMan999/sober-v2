// resolvers/queries/directMessages.js
const {
  AuthenticationError,
  UserInputError,
} = require("apollo-server-express");

const { Room, User } = require("../../models");
const { ensureSingleDirectRoom } = require("../utils/directMessage");

/**
 * Normalize a User mongoose doc to plain JS with string id.
 */
const normalizeUser = (userDoc) => {
  if (!userDoc) return null;
  const raw = userDoc.toObject ? userDoc.toObject() : userDoc;
  return {
    ...raw,
    id: raw.id || raw._id?.toString?.(),
  };
};

const ensureChatStyles = async (users = []) => {
  const unique = users.filter(Boolean);
  if (!unique.length) return [];

  return Promise.all(unique.map((user) => User.ensureChatRoomStyle(user)));
};

/**
 * Normalize a Comment mongoose doc to plain JS with string id and normalized author/replyTo.
 */
const normalizeComment = (commentDoc) => {
  if (!commentDoc) return null;
  const raw = commentDoc.toObject ? commentDoc.toObject() : commentDoc;

  const authorRaw = raw.author;
  const author =
    authorRaw && authorRaw.toObject ? authorRaw.toObject() : authorRaw;

  const replyToRaw = raw.replyTo;
  const replyTo =
    replyToRaw && replyToRaw.toObject ? replyToRaw.toObject() : replyToRaw;

  const authorStyle =
    typeof author?.chatRoomStyle === "number"
      ? author.chatRoomStyle
      : typeof author?.messageStyle === "number"
      ? author.messageStyle
      : undefined;

  return {
    ...raw,
    id: raw.id || raw._id?.toString?.(),
    author: author
      ? {
          ...author,
          id: author.id || author._id?.toString?.(),
          messageStyle: authorStyle,
        }
      : null,
    replyTo: replyTo
      ? {
          ...replyTo,
          id: replyTo.id || replyTo._id?.toString?.(),
        }
      : null,
  };
};

/**
 * Normalize a Room mongoose doc for GraphQL:
 * - room.id as string
 * - users[].id as string
 * - comments[].id as string
 * - lastMessage.id as string
 */
const normalizeRoomForGraphQL = (roomDoc) => {
  if (!roomDoc) return null;

  const raw = roomDoc.toObject ? roomDoc.toObject() : roomDoc;

  const users = (raw.users || [])
    .filter(Boolean)
    .map(normalizeUser)
    .filter((u) => !!u.id);

  const comments = (raw.comments || [])
    .filter(Boolean)
    .map(normalizeComment)
    // make sure we never return a comment without an id
    .filter((c) => !!c.id);

  let lastMessage = null;
  if (raw.lastMessage) {
    const lmRaw = raw.lastMessage.toObject
      ? raw.lastMessage.toObject()
      : raw.lastMessage;

    const lmAuthorRaw = lmRaw.author;
    const lmAuthor =
      lmAuthorRaw && lmAuthorRaw.toObject
        ? lmAuthorRaw.toObject()
        : lmAuthorRaw;

    lastMessage = {
      ...lmRaw,
      id: lmRaw.id || lmRaw._id?.toString?.(),
      author: lmAuthor
        ? {
            ...lmAuthor,
            id: lmAuthor.id || lmAuthor._id?.toString?.(),
          }
        : null,
    };
  }

  return {
    ...raw,
    id: raw.id || raw._id?.toString?.(),
    users,
    comments,
    lastMessage,
  };
};

module.exports = {
  myDirectRoomsResolver: async (_, __, ctx) => {
    const me = ctx.currentUser;
    if (!me) throw new AuthenticationError("Not authenticated");

    const rooms = await Room.find({ isDirect: true, users: me._id })
      .sort({ lastMessageAt: -1 })
      .populate([
        {
          path: "users",
          populate: "profilePic",
        },
        {
          path: "lastMessage",
          populate: { path: "author", populate: "profilePic" },
        },
      ])
      .populate({
        path: "comments",
        options: { sort: { createdAt: 1 } }, // oldest → newest
        populate: [
          { path: "author", populate: "profilePic" },
          { path: "replyTo", populate: { path: "author", model: "User" } },
        ],
      })
      .exec();

    await Promise.all(
      rooms.map((room) =>
        ensureChatStyles([
          ...(room?.users || []),
          room?.lastMessage?.author,
          ...(room?.comments || []).flatMap((comment) => [
            comment?.author,
            comment?.replyTo?.author,
          ]),
        ])
      )
    );

    // Normalize everything so GraphQL sees string IDs, not Buffers/Objects
    return rooms.map((room) => normalizeRoomForGraphQL(room));
  },

  directRoomWithUserResolver: async (_, { userId }, ctx) => {
    try {
      const me = ctx.currentUser;
      if (!me) throw new AuthenticationError("Not authenticated");

      if (String(me._id) === String(userId)) {
        throw new UserInputError("Cannot start a DM with yourself.");
      }

      const otherUser = await User.findById(userId);
      if (!otherUser) {
        throw new UserInputError("User not found");
      }

      const ensuredRoom = await ensureSingleDirectRoom(me._id, otherUser._id);
      if (!ensuredRoom) {
        throw new AuthenticationError("Cannot find a room");
      }

      const room = await Room.findById(ensuredRoom._id)
        .populate([
          {
            path: "users",
            populate: "profilePic",
          },
          {
            path: "lastMessage",
            populate: { path: "author", populate: "profilePic" },
          },
        ])
        .populate({
          path: "comments",
          options: { sort: { createdAt: 1 } },
          populate: [
            { path: "author", populate: "profilePic" },
            { path: "replyTo", populate: { path: "author", model: "User" } },
          ],
        });

      await ensureChatStyles([
        ...(room?.users || []),
        room?.lastMessage?.author,
        ...(room?.comments || []).flatMap((comment) => [
          comment?.author,
          comment?.replyTo?.author,
        ]),
      ]);

      const normalized = normalizeRoomForGraphQL(room);

      return normalized;
    } catch (err) {
      throw new AuthenticationError("Error getting DM room: " + err.message);
    }
  },
};
