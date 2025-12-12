const { AuthenticationError } = require("apollo-server-express");

const {
  User,
  Quote,
  Post,
  Like,
  Comment,
  Notification,
} = require("../../models");
const { getDistanceFromCoords, ensureTrialEndsAt } = require("../../utils/helpers");
const { findClosestCity } = require("../../utils/location");
const {
  NotificationTypes,
  NotificationIntents,
  createNotificationForUser,
} = require("../../utils/notifications");
const { serializeUser } = require("../../utils/serializeUser");

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
    const appleId = ctx?.appleId || args?.appleId;
    const token = ctx?.token || args?.token;

    try {
      if (ctx?.currentUser) {
        await ensureTrialEndsAt(ctx.currentUser);
        return serializeUser(ctx.currentUser);
      }

      if (!token && !appleId) {
        throw new AuthenticationError("Token or Apple ID is required");
      }

      const query = appleId ? { appleId } : { token };
      const user = await User.findOne(query).populate([
        "profilePic",
        "drunkPic",
        "savedPosts",
        "savedQuotes",
      ]);
      if (!user) {
        throw new AuthenticationError("User not found");
      }
      await ensureTrialEndsAt(user);
      await User.ensureChatRoomStyle(user);
      return serializeUser(user);
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

    const userId = user._id;

    const notifications = await Notification.find({
      user: userId,
      $or: [{ dismissed: { $exists: false } }, { dismissed: { $ne: true } }],
    }).sort({ read: 1, createdAt: -1 });

    return notifications.map((notification) => ({
      id: notification.notificationId,
      type: notification.type || NotificationTypes.COMMENT_ON_POST,
      title: notification.title || "Notification",
      description: notification.description,
      intent: notification.intent,
      postId: notification.postId,
      quoteId: notification.quoteId,
      commentId: notification.commentId,
      milestoneDays: notification.milestoneDays,
      milestoneTag: notification.milestoneTag,
      fromUserId: notification.fromUserId,
      fromUsername: notification.fromUsername,
      fromProfilePicUrl: notification.fromProfilePicUrl,
      venueName: notification.venueName,
      venueType: notification.venueType,
      roomId: notification.roomId,
      roomName: notification.roomName,
      createdAt:
        notification.createdAt?.toISOString?.() || notification.createdAt,
      read: Boolean(notification.read),
      dismissed: Boolean(notification.dismissed),
    }));
  },
  usersResolver: async (_, { limit = 10 }) => {
    const safeLimit = Math.min(limit, 50);

    const pipeline = [
      // Optional: only users with an avatar
      { $match: { profilePic: { $exists: true, $ne: null } } },
      { $sample: { size: safeLimit } },
    ];

    const docs = await User.aggregate(pipeline);

    // If you need `profilePic` populated (e.g., GridFS or a separate collection)
    await User.populate(docs, { path: "profilePic" });

    return docs;
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
      minDaysSober,
      maxDaysSober,
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

    if (minDaysSober != null || maxDaysSober != null) {
      baseQuery.daysSober = {};

      if (minDaysSober != null) {
        baseQuery.daysSober.$gte = minDaysSober;
      }

      if (maxDaysSober != null) {
        baseQuery.daysSober.$lte = maxDaysSober;
      }
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

  userPostsResolver: async (
    _,
    { token, appleId, userId, limit: limitArg, cursor: cursorArg },
    { currentUser }
  ) => {
    const sanitizedAppleId = appleId?.trim();

    if (!token && !sanitizedAppleId) {
      throw new AuthenticationError("Token or Apple ID is required");
    }

    if (!userId) {
      throw new Error("userId is required");
    }

    let viewer = currentUser;

    if (!viewer) {
      if (sanitizedAppleId) {
        viewer = await User.findOne({ appleId: sanitizedAppleId });
      }

      if (!viewer && token) {
        viewer = await User.findOne({ token });
      }
    }

    if (!viewer) {
      throw new AuthenticationError("User not found");
    }

    const limit = Math.min(limitArg || 24, 50);
    const cursor = cursorArg ? new Date(cursorArg) : null;

    const query = { author: userId };
    if (cursor) {
      query.createdAt = { $lt: cursor };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate("author")
      .populate("closestCity")
      .populate({
        path: "video",
        select: "url flagged viewsCount viewers thumbnailUrl",
      });

    const hasMore = posts.length > limit;
    const slicedPosts = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = slicedPosts.length
      ? slicedPosts[slicedPosts.length - 1].createdAt?.toISOString?.() || null
      : null;

    return { posts: slicedPosts, hasMore, cursor: nextCursor };
  },

  postResolver: async (_, { postId, includeFlagged = false }) => {
    if (!postId) {
      throw new Error("postId is required");
    }

    try {
      const match = { _id: postId };
      if (!includeFlagged) {
        match.flagged = false;
      }

      const post = await Post.findOne(match)
        .populate("author")
        .populate({
          path: "video",
          match: includeFlagged ? {} : { flagged: false },
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

  profileOverviewResolver: async (_, { token, appleId }) => {
    const sanitizedAppleId = appleId?.trim();

    if (!token && !sanitizedAppleId) {
      throw new AuthenticationError("Token or Apple ID is required");
    }

    let user = null;

    if (sanitizedAppleId) {
      user = await User.findOne({ appleId: sanitizedAppleId });
    }

    if (!user && token) {
      user = await User.findOne({ token });
    }

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    await user.populate([
      "profilePic",
      "drunkPic",
      "savedPosts",
      "savedQuotes",
    ]);

    await User.ensureChatRoomStyle(user);

    const limit = 12;

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate("author")
      .populate({
        path: "video",
        select: "url flagged viewsCount viewers thumbnailUrl",
      });

    const hasMorePosts = posts.length > limit;
    const trimmedPosts = hasMorePosts ? posts.slice(0, limit) : posts;
    const postCursor = trimmedPosts.length
      ? trimmedPosts[trimmedPosts.length - 1].createdAt?.toISOString?.() || null
      : null;

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
      posts: trimmedPosts,
      postCursor,
      hasMorePosts,
      quotes,
      savedPosts,
      savedQuotes,
    };
  },

  userProfileResolver: async (
    _,
    { token, appleId, userId },
    { currentUser }
  ) => {
    const sanitizedAppleId = appleId?.trim();

    if (!token && !sanitizedAppleId) {
      throw new AuthenticationError("Token or Apple ID is required");
    }

    if (!userId) {
      throw new Error("userId is required");
    }

    let viewer = currentUser;

    if (!viewer) {
      if (sanitizedAppleId) {
        viewer = await User.findOne({ appleId: sanitizedAppleId }).populate(
          "profilePic"
        );
      }

      if (!viewer && token) {
        viewer = await User.findOne({ token }).populate("profilePic");
      }
    }

    if (!viewer) {
      throw new AuthenticationError("User not found");
    }

    await User.ensureChatRoomStyle(viewer);

    const user = await User.findById(userId).populate([
      "profilePic",
      "drunkPic",
      "savedPosts",
      "savedQuotes",
    ]);

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    await User.ensureChatRoomStyle(user);

    const limit = 12;

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate("author")
      .populate("closestCity")
      .populate({
        path: "video",
        select: "url flagged viewsCount viewers thumbnailUrl",
      });

    const hasMorePosts = posts.length > limit;
    const trimmedPosts = hasMorePosts ? posts.slice(0, limit) : posts;
    const postCursor = trimmedPosts.length
      ? trimmedPosts[trimmedPosts.length - 1].createdAt?.toISOString?.() || null
      : null;

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
      posts: trimmedPosts,
      postCursor,
      hasMorePosts,
      quotes,
      savedPosts,
      savedQuotes,
    };
  },
};
