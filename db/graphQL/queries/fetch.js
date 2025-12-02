const { AuthenticationError } = require("apollo-server-express");

const { User, Quote, Post } = require("../../models");
const { getDistanceFromCoords } = require("../../utils/helpers");
const postAuthorPopulate = {
  path: "author",
  populate: ["profilePic", "drunkPic"],
};

const postVideoPopulate = {
  path: "video",
  match: { flagged: false },
  select: "url flagged viewsCount viewers thumbnailUrl",
};

const postBasePopulates = [postAuthorPopulate, postVideoPopulate, "closestCity"];

require("dotenv").config();

const toPlain = (doc) => (doc?.toObject ? doc.toObject() : doc) || null;

const ensureId = (doc) => {
  const plain = toPlain(doc);
  if (!plain) return null;

  const id = plain.id || plain._id?.toString?.();
  if (!id) return null;

  return { ...plain, id };
};

const normalizeUser = (userDoc) => {
  const base = ensureId(userDoc);
  if (!base) return null;

  const profilePic = base.profilePic ? ensureId(base.profilePic) : null;
  const drunkPic = base.drunkPic ? ensureId(base.drunkPic) : null;

  return {
    ...base,
    profilePic,
    drunkPic,
    profilePicUrl: base.profilePicUrl || profilePic?.url || null,
    drunkPicUrl: base.drunkPicUrl || drunkPic?.url || null,
  };
};

const normalizeComment = (commentDoc) => {
  const base = ensureId(commentDoc);
  if (!base) return null;

  const author = normalizeUser(base.author);
  if (!author) return null;

  const replyToBase = base.replyTo ? ensureId(base.replyTo) : null;
  const replyToAuthor = replyToBase ? normalizeUser(replyToBase.author) : null;
  const replyTo = replyToBase && replyToAuthor
    ? { ...replyToBase, author: replyToAuthor }
    : null;

  const replies = Array.isArray(base.replies)
    ? base.replies.map(normalizeComment).filter(Boolean)
    : [];

  return {
    ...base,
    author,
    replyTo,
    replies,
    likesCount: base.likesCount ?? 0,
  };
};

const normalizePost = (postDoc, { includeComments = false } = {}) => {
  const base = ensureId(postDoc);
  if (!base) return null;

  const author = normalizeUser(base.author);
  if (!author) return null;

  const video = base.video ? ensureId(base.video) : null;
  const closestCity = base.closestCity ? ensureId(base.closestCity) : null;
  const comments = includeComments && Array.isArray(base.comments)
    ? base.comments.map(normalizeComment).filter(Boolean)
    : [];

  const videoViews = video?.viewsCount ?? 0;

  return {
    ...base,
    author,
    video: video ? { ...video, viewsCount: video.viewsCount ?? 0 } : null,
    closestCity,
    likesCount: base.likesCount ?? 0,
    commentsCount: base.commentsCount ?? comments.length,
    viewsCount: base.viewsCount ?? videoViews ?? 0,
    comments,
  };
};

const normalizeQuote = (quoteDoc, { includeComments = false } = {}) => {
  const base = ensureId(quoteDoc);
  if (!base) return null;

  const user = normalizeUser(base.user);
  const comments = includeComments && Array.isArray(base.comments)
    ? base.comments.map(normalizeComment).filter(Boolean)
    : [];

  return {
    ...base,
    user,
    likesCount: base.likesCount ?? 0,
    commentsCount: base.commentsCount ?? comments.length,
    comments,
  };
};

const buildRepliesPopulate = (depth = 1) => {
  const basePopulate = [
    { path: "author", populate: ["profilePic", "drunkPic"] },
    {
      path: "replyTo",
      populate: { path: "author", populate: ["profilePic", "drunkPic"] },
    },
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
        { path: "savedPosts", populate: postBasePopulates },
        {
          path: "savedQuotes",
          populate: [{ path: "user", populate: ["profilePic", "drunkPic"] }],
        },
      ]);
      if (!user) {
        throw new AuthenticationError("User not found");
      }

      const normalizedUser = normalizeUser(user);
      const normalizedSavedPosts = (user.savedPosts || [])
        .map((post) => normalizePost(post))
        .filter(Boolean);
      const normalizedSavedQuotes = (user.savedQuotes || [])
        .map((quote) => normalizeQuote(quote))
        .filter(Boolean);

      return {
        ...normalizedUser,
        savedPosts: normalizedSavedPosts,
        savedQuotes: normalizedSavedQuotes,
      };
    } catch (err) {
      throw new AuthenticationError(err.message);
    }
  },
  getQuotesResolver: async () => {
    try {
      const quotes = await Quote.find({ isApproved: true })
        .sort({ createdAt: -1 })
        .populate({ path: "user", populate: ["profilePic", "drunkPic"] })
        .populate({
          path: "comments",
          match: { $or: [{ replyTo: null }, { replyTo: { $exists: false } }] },
          populate: buildRepliesPopulate(2),
        });

      return quotes
        .map((quote) => normalizeQuote(quote, { includeComments: true }))
        .filter(Boolean);
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

    const limit = Math.min(limitArg || 20, 50);
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

    const earthRadiusMeters = 6_378_137;
    const defaultDistanceMiles = 50;
    const circumferenceRadians = Math.PI;
    const milesToRadians = (miles) => (miles * 1609.34) / earthRadiusMeters;

    const computeGeoFilter = (radiusRadians) =>
      sortByClosest && refLat != null && refLong != null
        ? {
            location: {
              $geoWithin: {
                $centerSphere: [[refLong, refLat], radiusRadians],
              },
            },
          }
        : {};

    const isNearbyQuery = sortByClosest && refLat != null && refLong != null;
    let searchRadius = milesToRadians(defaultDistanceMiles);

    try {
      const runQueryWithRadius = async (radiusRadians) =>
        Post.find({ ...baseQuery, ...computeGeoFilter(radiusRadians) })
          .sort({ createdAt: -1 })
          .limit(limit + 1)
          .populate(postBasePopulates)
          .populate({
            path: "comments",
            match: { $or: [{ replyTo: null }, { replyTo: { $exists: false } }] },
            populate: buildRepliesPopulate(2),
          });

      let posts = await runQueryWithRadius(searchRadius);

      while (isNearbyQuery && posts.length < limit + 1 && searchRadius < circumferenceRadians) {
        const nextRadius = Math.min(searchRadius * 2, circumferenceRadians);
        searchRadius = nextRadius;
        posts = await runQueryWithRadius(searchRadius);
      }

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
            ? post.viewers?.some((id) =>
                typeof id?.equals === "function"
                  ? id.equals(viewer._id)
                  : String(id) === String(viewer._id)
              ) ||
              post.video?.viewers?.some((id) =>
                typeof id?.equals === "function"
                  ? id.equals(viewer._id)
                  : String(id) === String(viewer._id)
              ) ||
              false
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

      const hasMoreFromCount = orderedPosts.length > limit;
      const hasMoreFromRadius = isNearbyQuery && searchRadius < circumferenceRadians;
      const hasMore = hasMoreFromCount || hasMoreFromRadius;
      const trimmed = hasMoreFromCount ? orderedPosts.slice(0, limit) : orderedPosts;

      const nextCursor = hasMore
        ? trimmed[trimmed.length - 1].createdAt.toISOString()
        : null;

      const normalizedPosts = trimmed
        .map((post) => normalizePost(post, { includeComments: true }))
        .filter(Boolean);

      return {
        posts: normalizedPosts,
        hasMore,
        cursor: nextCursor,
      };
    } catch (err) {
      throw new Error(err.message);
    }
  },

  postResolver: async (_, { postId }) => {
    if (!postId) {
      throw new Error("postId is required");
    }

    try {
      const post = await Post.findOne({ _id: postId, flagged: false })
        .populate(postBasePopulates)
        .populate({
          path: "comments",
          match: { $or: [{ replyTo: null }, { replyTo: { $exists: false } }] },
          populate: buildRepliesPopulate(2),
        });

      if (!post) {
        return null;
      }

      return normalizePost(post, { includeComments: true });
    } catch (err) {
      throw new Error(err.message);
    }
  },

  quoteResolver: async (_, { quoteId }) => {
    if (!quoteId) {
      throw new Error("quoteId is required");
    }

    try {
      const quote = await Quote.findById(quoteId)
        .populate({ path: "user", populate: ["profilePic", "drunkPic"] })
        .populate({
          path: "comments",
          match: { $or: [{ replyTo: null }, { replyTo: { $exists: false } }] },
          populate: buildRepliesPopulate(2),
        });

      return normalizeQuote(quote, { includeComments: true });
    } catch (err) {
      throw new Error(err.message);
    }
  },

  profileOverviewResolver: async (_, { token }) => {
    if (!token) {
      throw new AuthenticationError("Token is required");
    }

    const user = await User.findOne({ token }).populate([
      "profilePic",
      "drunkPic",
      { path: "savedPosts", populate: postBasePopulates },
      {
        path: "savedQuotes",
        populate: [{ path: "user", populate: ["profilePic", "drunkPic"] }],
      },
    ]);

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate(postBasePopulates);

    const savedPosts = await Post.find({ _id: { $in: user.savedPosts || [] } })
      .sort({ createdAt: -1 })
      .populate(postBasePopulates);

    const savedQuotes = await Quote.find({ _id: { $in: user.savedQuotes || [] } })
      .sort({ createdAt: -1 })
      .populate({ path: "user", populate: ["profilePic", "drunkPic"] });

    const quotes = await Quote.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({ path: "user", populate: ["profilePic", "drunkPic"] });

    const normalizedQuotes = quotes
      .map((quote) => normalizeQuote(quote))
      .filter(Boolean);
    const normalizedUser = normalizeUser(user);
    const normalizedPosts = posts.map((post) => normalizePost(post)).filter(Boolean);
    const normalizedSavedPosts = savedPosts
      .map((post) => normalizePost(post))
      .filter(Boolean);
    const normalizedSavedQuotes = savedQuotes
      .map((quote) => normalizeQuote(quote))
      .filter(Boolean);

    return {
      user: normalizedUser,
      posts: normalizedPosts,
      quotes: normalizedQuotes,
      savedPosts: normalizedSavedPosts,
      savedQuotes: normalizedSavedQuotes,
    };
  },

  userProfileResolver: async (_, { token, userId }, { currentUser }) => {
    if (!token) {
      throw new AuthenticationError("Token is required");
    }

    if (!userId) {
      throw new Error("userId is required");
    }

    const viewer =
      currentUser || (await User.findOne({ token }).populate("profilePic"));

    if (!viewer) {
      throw new AuthenticationError("User not found");
    }

    const user = await User.findById(userId).populate([
      "profilePic",
      "drunkPic",
      { path: "savedPosts", populate: postBasePopulates },
      {
        path: "savedQuotes",
        populate: [{ path: "user", populate: ["profilePic", "drunkPic"] }],
      },
    ]);

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate(postBasePopulates);

    const savedPosts = await Post.find({ _id: { $in: user.savedPosts || [] } })
      .sort({ createdAt: -1 })
      .populate(postBasePopulates);

    const savedQuotes = await Quote.find({ _id: { $in: user.savedQuotes || [] } })
      .sort({ createdAt: -1 })
      .populate({ path: "user", populate: ["profilePic", "drunkPic"] });

    const quotes = await Quote.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({ path: "user", populate: ["profilePic", "drunkPic"] });

    const normalizedQuotes = quotes
      .map((quote) => normalizeQuote(quote))
      .filter(Boolean);
    const normalizedUser = normalizeUser(user);
    const normalizedPosts = posts.map((post) => normalizePost(post)).filter(Boolean);
    const normalizedSavedPosts = savedPosts
      .map((post) => normalizePost(post))
      .filter(Boolean);
    const normalizedSavedQuotes = savedQuotes
      .map((quote) => normalizeQuote(quote))
      .filter(Boolean);

    return {
      user: normalizedUser,
      posts: normalizedPosts,
      quotes: normalizedQuotes,
      savedPosts: normalizedSavedPosts,
      savedQuotes: normalizedSavedQuotes,
    };
  },
};
