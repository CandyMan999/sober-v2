const { AuthenticationError } = require("apollo-server-express");

const { User, Quote, Post, Like, Comment } = require("../../models");
const { getDistanceFromCoords } = require("../../utils/helpers");
const { findClosestCity } = require("../../utils/location");

require("dotenv").config();

const ADMIN_USERNAME = "CandyMan🍭";

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
        "savedPosts",
        "savedQuotes",
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
  adminFlaggedPostsResolver: async (_, { token }) => {
    if (!token) {
      throw new AuthenticationError("Token is required");
    }

    const user = await User.findOne({ token });
    if (!user || user.username !== ADMIN_USERNAME) {
      throw new AuthenticationError("Unauthorized");
    }

    try {
      const posts = await Post.find({
        adminApproved: false,
        review: true,
      })
        .sort({ createdAt: -1 })
        .populate("author")
        .populate({
          path: "video",
          select: "url flagged viewsCount viewers thumbnailUrl",
        })
        .populate("closestCity");

      return posts;
    } catch (err) {
      throw new Error(err.message);
    }
  },
  adminPendingQuotesResolver: async (_, { token }) => {
    if (!token) {
      throw new AuthenticationError("Token is required");
    }

    const user = await User.findOne({ token });
    if (!user || user.username !== ADMIN_USERNAME) {
      throw new AuthenticationError("Unauthorized");
    }

    try {
      const quotes = await Quote.find({
        isApproved: false,
        isDenied: false,
      })
        .sort({ createdAt: -1 })
        .populate("user");

      return quotes;
    } catch (err) {
      throw new Error(err.message);
    }
  },
  userNotificationsResolver: async (_, { token }) => {
    if (!token) {
      throw new AuthenticationError("Token is required");
    }

    const user = await User.findOne({ token });
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const NOTIFICATION_TYPES = {
      COMMENT: "COMMENT_ON_POST",
      COMMENT_REPLY: "COMMENT_REPLY",
      COMMENT_LIKED: "COMMENT_LIKED",
      FLAGGED: "FLAGGED_POST",
      BUDDY_NEAR_BAR: "BUDDY_NEAR_BAR",
    };

    const INTENTS = {
      OPEN_POST: "OPEN_POST_COMMENTS",
      ACK: "ACKNOWLEDGE",
    };

    const userId = user._id;
    const [userPosts, userComments] = await Promise.all([
      Post.find({ author: userId }),
      Comment.find({ author: userId }),
    ]);

    const postIds = userPosts.map((post) => post._id);
    const commentIds = userComments.map((comment) => comment._id);
    const commentIdsSet = new Set(commentIds.map((id) => id.toString()));

    const [commentsOnPosts, repliesToUserComments, likesOnComments] =
      await Promise.all([
      postIds.length
        ? Comment.find({
            targetType: "POST",
            targetId: { $in: postIds },
          })
            .sort({ createdAt: -1 })
            .populate("author")
        : [],
      commentIds.length
        ? Comment.find({
            replyTo: { $in: commentIds },
          })
            .sort({ createdAt: -1 })
            .populate("author")
            .populate({ path: "replyTo", populate: "author" })
        : [],
      commentIds.length
        ? Like.find({
            targetType: "COMMENT",
            targetId: { $in: commentIds },
            user: { $ne: userId },
          })
            .sort({ createdAt: -1 })
            .populate("user")
        : [],
    ]);

    const commentsById = new Map(
      userComments.map((comment) => [comment._id.toString(), comment])
    );

    const commentNotifications = commentsOnPosts
      .filter((comment) => comment?.author && !comment.author._id.equals(userId))
      .filter((comment) => !commentIdsSet.has(comment?.replyTo?.toString()))
      .map((comment) => ({
        id: `comment-${comment._id.toString()}`,
        type: NOTIFICATION_TYPES.COMMENT,
        title: `${comment.author.username || "Someone"} commented on your post`,
        description: comment.text,
        postId: comment.targetId.toString(),
        commentId: comment._id.toString(),
        createdAt: comment.createdAt,
        intent: INTENTS.OPEN_POST,
      }));

    const commentReplyNotifications = repliesToUserComments
      .filter((comment) => comment?.author && !comment.author._id.equals(userId))
      .map((comment) => ({
        id: `comment-reply-${comment._id.toString()}`,
        type: NOTIFICATION_TYPES.COMMENT_REPLY,
        title: `${comment.author.username || "Someone"} replied to your comment`,
        description: comment.text,
        postId: comment.targetId.toString(),
        commentId: comment._id.toString(),
        createdAt: comment.createdAt,
        intent: INTENTS.OPEN_POST,
      }));

    const commentLikeNotifications = likesOnComments
      .map((like) => {
        const comment = commentsById.get(like.targetId.toString());
        if (!comment) return null;

        return {
          id: `comment-like-${like._id.toString()}`,
          type: NOTIFICATION_TYPES.COMMENT_LIKED,
          title: `${like.user?.username || "Someone"} liked your comment`,
          description: comment.text,
          postId: comment.targetId.toString(),
          commentId: comment._id.toString(),
          createdAt: like.createdAt,
          intent: INTENTS.ACK,
        };
      })
      .filter(Boolean);

    const flaggedPostNotifications = userPosts
      .filter((post) => post.flagged === true || post.review === true)
      .map((post) => ({
        id: `flagged-${post._id.toString()}`,
        type: NOTIFICATION_TYPES.FLAGGED,
        title: "A post needs your attention",
        description:
          "Your post was flagged by our team. Inappropriate content can lead to a ban.",
        postId: post._id.toString(),
        createdAt: post.updatedAt || post.createdAt,
        intent: INTENTS.OPEN_POST,
      }));

    const buddyNearBarPlaceholder = {
      id: "buddy-placeholder",
      type: NOTIFICATION_TYPES.BUDDY_NEAR_BAR,
      title: "Buddy check-in",
      description: "A buddy was tracked near a bar. Placeholder until tracking is live.",
      createdAt: new Date().toISOString(),
      intent: INTENTS.ACK,
    };

    return [
      ...commentNotifications,
      ...commentReplyNotifications,
      ...commentLikeNotifications,
      ...flaggedPostNotifications,
      buddyNearBarPlaceholder,
    ].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
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
          .populate("author")
          .populate({
            path: "video",
            match: { flagged: false },
            select: "url flagged viewsCount viewers thumbnailUrl",
          })
          .populate("closestCity")
          .populate({
            path: "comments",
            match: {
              $or: [{ replyTo: null }, { replyTo: { $exists: false } }],
            },
            populate: buildRepliesPopulate(2),
          });

      let posts = await runQueryWithRadius(searchRadius);

      while (
        isNearbyQuery &&
        posts.length < limit + 1 &&
        searchRadius < circumferenceRadians
      ) {
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
      const hasMoreFromRadius =
        isNearbyQuery && searchRadius < circumferenceRadians;
      const hasMore = hasMoreFromCount || hasMoreFromRadius;
      const trimmed = hasMoreFromCount
        ? orderedPosts.slice(0, limit)
        : orderedPosts;

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

  postResolver: async (_, { postId }) => {
    if (!postId) {
      throw new Error("postId is required");
    }

    try {
      const post = await Post.findOne({ _id: postId, flagged: false })
        .populate("author")
        .populate({
          path: "video",
          match: { flagged: false },
          select: "url flagged viewsCount viewers thumbnailUrl",
        })
        .populate("closestCity")
        .populate({
          path: "comments",
          match: { $or: [{ replyTo: null }, { replyTo: { $exists: false } }] },
          populate: buildRepliesPopulate(2),
        });

      if (!post) {
        return null;
      }

      return post;
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
        .populate("user")
        .populate({
          path: "comments",
          match: { $or: [{ replyTo: null }, { replyTo: { $exists: false } }] },
          populate: buildRepliesPopulate(2),
        });

      return quote;
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
      "savedPosts",
      "savedQuotes",
    ]);

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate("author")
      .populate({
        path: "video",
        select: "url flagged viewsCount viewers thumbnailUrl",
      });

    const savedPosts = await Post.find({ _id: { $in: user.savedPosts || [] } })
      .sort({ createdAt: -1 })
      .populate("author")
      .populate({
        path: "video",
        select: "url flagged viewsCount viewers thumbnailUrl",
      });

    const savedQuotes = await Quote.find({
      _id: { $in: user.savedQuotes || [] },
    })
      .sort({ createdAt: -1 })
      .populate("user");

    const quotes = await Quote.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate("user");

    return {
      user,
      posts,
      quotes,
      savedPosts,
      savedQuotes,
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
      "savedPosts",
      "savedQuotes",
    ]);

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate("author")
      .populate("closestCity")
      .populate({
        path: "video",
        select: "url flagged viewsCount viewers thumbnailUrl",
      });

    const savedPosts = await Post.find({ _id: { $in: user.savedPosts || [] } })
      .sort({ createdAt: -1 })
      .populate("author")
      .populate("closestCity")
      .populate({
        path: "video",
        select: "url flagged viewsCount viewers thumbnailUrl",
      });

    const savedQuotes = await Quote.find({
      _id: { $in: user.savedQuotes || [] },
    })
      .sort({ createdAt: -1 })
      .populate("user");

    const quotes = await Quote.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate("user");

    const city = await findClosestCity(user.lat ?? null, user.long ?? null);
    const serializePicture = (picture) => {
      if (!picture) return null;

      const plain = picture.toObject ? picture.toObject() : picture;
      const pictureId = plain.id || plain._id?.toString();

      if (!pictureId) return null;

      return {
        ...plain,
        id: pictureId,
      };
    };

    const serializedUser = user.toObject ? user.toObject() : user;
    const profilePic = serializePicture(serializedUser.profilePic);
    const drunkPic = serializePicture(serializedUser.drunkPic);

    return {
      user: {
        ...serializedUser,
        id: serializedUser.id || serializedUser._id?.toString(),
        profilePic,
        drunkPic,
        closestCity: city,
      },
      posts,
      quotes,
      savedPosts,
      savedQuotes,
    };
  },
};
