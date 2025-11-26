const { AuthenticationError } = require("apollo-server-express");

const { User, Quote, Post } = require("../../models");

require("dotenv").config();

const buildRepliesPopulate = (depth = 1) => {
  const basePopulate = [
    { path: "author" },
    { path: "replyTo", populate: { path: "author" } },
  ];

  if (depth > 0) {
    basePopulate.push({
      path: "replies",
      populate: buildRepliesPopulate(depth - 1),
    });
  }

  return basePopulate;
};

module.exports = {
  fetchMeResolver: async (root, args, ctx) => {
    const { token } = args;

    try {
      const user = await User.findOne({ token }).populate([
        "profilePic",
        "drunkPic",
      ]);
      if (!user) {
        throw new AuthenticationError("User not found");
      }
      return user;
    } catch (err) {
      throw new AuthenticationError(err.message);
    }
  },
  getQuotesResolver: async (root, args, ctx) => {
    try {
      const quotes = await Quote.find({ isApproved: true })
        .populate("user")
        .populate({
          path: "comments",
          match: { $or: [{ replyTo: null }, { replyTo: { $exists: false } }] },
          populate: buildRepliesPopulate(2),
        });
      // Don't throw if none; just return empty array
      return quotes;
    } catch (err) {
      throw new Error(err.message);
    }
  },
  getAllPostsResolver: async (root, args) => {
    const limit = Math.min(args.limit || 10, 50);
    const cursor = args.cursor ? new Date(args.cursor) : null;

    const query = { flagged: false };
    if (cursor) {
      query.createdAt = { $lt: cursor };
    }

    try {
      const posts = await Post.find(query)
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .populate("author")
        .populate({
          path: "video",
          match: { flagged: false },
        })
        .populate({
          path: "comments",
          match: { $or: [{ replyTo: null }, { replyTo: { $exists: false } }] },
          populate: buildRepliesPopulate(2),
        });

      const sanitized = posts
        .map((post) => {
          if (!post.mediaType) {
            post.mediaType = "VIDEO";
          }
          return post;
        })
        .filter((post) => {
          if (post.mediaType === "IMAGE") {
            return !!post.imageUrl;
          }

          return !!post.video;
        });
      const hasMore = sanitized.length > limit;
      const trimmed = hasMore ? sanitized.slice(0, limit) : sanitized;

      const nextCursor = hasMore
        ? trimmed[trimmed.length - 1].createdAt.toISOString()
        : null;

      return {
        posts: trimmed,
        hasMore,
        cursor: nextCursor,
      };
    } catch (err) {
      throw new Error(err.message);
    }
  },
};
