const { AuthenticationError } = require("apollo-server-express");

const { User, Quote, Post } = require("../../models");
const { getDistanceFromCoords } = require("../../utils/helpers");

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
        .sort({ createdAt: -1 })
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
    const {
      limit: limitArg,
      cursor: cursorArg,
      lat,
      long,
      token,
      excludeViewed = false,
      sortByClosest = false,
      mediaType,
      isMilestone,
    } = args || {};

    const limit = Math.min(limitArg || 10, 50);
    const cursor = cursorArg ? new Date(cursorArg) : null;

    let refLat = lat ?? null;
    let refLong = long ?? null;
    let viewer = null;
    if (token) {
      viewer = await User.findOne({ token });
      if (viewer) {
        if (refLat == null) refLat = viewer.lat ?? null;
        if (refLong == null) refLong = viewer.long ?? null;
      }
    }

    const baseQuery = { flagged: false };
    if (cursor) baseQuery.createdAt = { $lt: cursor };
    if (mediaType) baseQuery.mediaType = mediaType;
    if (isMilestone) {
      baseQuery.$or = [
        { isMilestone: true },
        { milestoneTag: { $ne: null } },
        { milestoneDays: { $ne: null } },
      ];
    }

    const maxDistanceMiles = 50;
    const earthRadiusMeters = 6_378_137;
    const maxDistanceMeters = maxDistanceMiles * 1609.34;
    const maxDistanceRadians = maxDistanceMeters / earthRadiusMeters;

    const geoFilter =
      refLat != null && refLong != null
        ? {
            location: {
              $geoWithin: {
                $centerSphere: [[refLong, refLat], maxDistanceRadians],
              },
            },
          }
        : {};

    const query = { ...baseQuery, ...geoFilter };

    try {
      const posts = await Post.find(query)
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .populate("author")
        .populate({
          path: "video",
          match: { flagged: false },
          select: "url flagged viewsCount viewers",
        })
        .populate("closestCity")
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
        })
        .map((post) => {
          const viewed = viewer?._id
            ? post.video?.viewers?.some((id) => id.equals(viewer._id)) || false
            : false;
          return { post, viewed };
        });

      const referenceCoords = {
        lat: refLat,
        long: refLong,
      };

      const postsWithDistance = sanitized.map((entry) => {
        const hasCoords =
          referenceCoords.lat != null &&
          referenceCoords.long != null &&
          entry.post.lat != null &&
          entry.post.long != null;

        const distance = hasCoords
          ? getDistanceFromCoords(
              referenceCoords.lat,
              referenceCoords.long,
              entry.post.lat,
              entry.post.long
            )
          : Number.POSITIVE_INFINITY;

        return { ...entry, distance };
      });

      postsWithDistance.sort((a, b) => {
        if (excludeViewed && a.viewed !== b.viewed) {
          return a.viewed ? 1 : -1;
        }

        if (sortByClosest) {
          if (a.distance === b.distance) {
            return new Date(b.post.createdAt) - new Date(a.post.createdAt);
          }
          return a.distance - b.distance;
        }

        return new Date(b.post.createdAt) - new Date(a.post.createdAt);
      });

      const orderedPosts = postsWithDistance.map((entry) => entry.post);

      const hasMore = orderedPosts.length > limit;
      const trimmed = hasMore ? orderedPosts.slice(0, limit) : orderedPosts;

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
