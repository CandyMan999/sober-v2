const rootDefs = require("./rootDefs.js");

const {
  addPictureResolver,
  directUploadResolver,
  deletePhotoResolver,
  updateUserProfileResolver,
  resetSobrietyDateResolver,
  addQuoteResolver,
  sendPostResolver,
  sendImagePostResolver,
  deletePostResolver,
  deleteQuoteResolver,
  setPostReviewResolver,
  creatingPostCommentResolver,
  createQuoteCommentResolver,
  toggleLikeResolver,
  toggleSaveResolver,
  recordPostViewResolver,
  moderatePostResolver,
  moderateQuoteResolver,
  followUserResolver,
  unfollowUserResolver,
  updateSocialResolver,
  sendDirectMessageResolver,
  setDirectTypingResolver,
  deleteDirectRoomResolver,
  markNotificationReadResolver,
  dismissNotificationResolver,
  clearAllNotificationsResolver,
  deleteAccountResolver,
} = require("./mutations/index.js");

const {
  fetchMeResolver,
  getQuotesResolver,
  adminFlaggedPostsResolver,
  adminPendingQuotesResolver,
  userNotificationsResolver,
  getAllPostsResolver,
  userPostsResolver,
  postResolver,
  quoteResolver,
  profileOverviewResolver,
  userProfileResolver,
  myDirectRoomsResolver,
  directRoomWithUserResolver,
  getBarLocationResolver,
  getLiquorLocationResolver,
} = require("./queries/index.js");
const {
  directMessageReceivedSubscription,
  directRoomUpdatedSubscription,
  directTypingSubscription,
} = require("./subscription/subscription");

// Import models
const { Like, Comment, Connection, City } = require("../models");
const { findClosestCity } = require("../utils/location");

const typeDefs = [rootDefs];

// Reusable helper for likes
const resolveLikes = (targetType) => async (parent) => {
  try {
    const likes = await Like.find({
      targetType, // "QUOTE" or "POST"
      targetId: parent.id,
    })
      .populate("user")
      .exec();

    return likes;
  } catch (err) {
    console.error(`Error resolving likes for ${targetType}`, err);
    return [];
  }
};

const resolveId = (parent) => parent?.id || parent?._id?.toString?.();

const resolvers = {
  Query: {
    fetchMe: fetchMeResolver,
    getQuotes: getQuotesResolver,
    adminFlaggedPosts: adminFlaggedPostsResolver,
    adminPendingQuotes: adminPendingQuotesResolver,
    userNotifications: userNotificationsResolver,
    getAllPosts: getAllPostsResolver,
    userPosts: userPostsResolver,
    post: postResolver,
    quote: quoteResolver,
    profileOverview: profileOverviewResolver,
    userProfile: userProfileResolver,
    myDirectRooms: myDirectRoomsResolver,
    directRoomWithUser: directRoomWithUserResolver,
    getBarLocation: getBarLocationResolver,
    getLiquorLocation: getLiquorLocationResolver,
  },

  Mutation: {
    directUpload: directUploadResolver,
    addPicture: addPictureResolver,
    deletePhoto: deletePhotoResolver,
    updateUserProfile: updateUserProfileResolver,

    resetSobrietyDate: resetSobrietyDateResolver,
    addQuote: addQuoteResolver,
    sendPost: sendPostResolver,
    sendImagePost: sendImagePostResolver,
    deletePost: deletePostResolver,
    deleteQuote: deleteQuoteResolver,
    setPostReview: setPostReviewResolver,
    createPostComment: creatingPostCommentResolver,
    createQuoteComment: createQuoteCommentResolver,
    toggleLike: toggleLikeResolver,
    toggleSave: toggleSaveResolver,
    moderatePost: moderatePostResolver,
    moderateQuote: moderateQuoteResolver,
    recordPostView: recordPostViewResolver,
    followUser: followUserResolver,
    unfollowUser: unfollowUserResolver,
    updateSocial: updateSocialResolver,
    sendDirectMessage: sendDirectMessageResolver,
    setDirectTyping: setDirectTypingResolver,
    deleteDirectRoom: deleteDirectRoomResolver,
    markNotificationRead: markNotificationReadResolver,
    dismissNotification: dismissNotificationResolver,
    clearAllNotifications: clearAllNotificationsResolver,
    deleteAccount: deleteAccountResolver,
  },

  Upload: require("graphql-upload-minimal").GraphQLUpload,

  Subscription: {
    directMessageReceived: directMessageReceivedSubscription,
    directRoomUpdated: directRoomUpdatedSubscription,
    directTyping: directTypingSubscription,
  },

  // ---- Type-level resolvers ----
  Quote: {
    id: resolveId,
    likes: resolveLikes("QUOTE"),
  },

  Post: {
    id: resolveId,
    likes: resolveLikes("POST"),
    viewsCount: (parent) => {
      const postViews =
        typeof parent?.viewsCount === "number" ? parent.viewsCount : 0;
      const videoViews = parent?.video?.viewsCount ?? 0;

      return postViews || videoViews || 0;
    },
  },

  Comment: {
    id: resolveId,
    likes: resolveLikes("COMMENT"),
    likesCount: (parent) => parent?.likesCount ?? 0,
    replyTo: async (parent) => {
      if (!parent.replyTo) return null;
      if (parent.replyTo._id) return parent.replyTo;
      try {
        return await Comment.findById(parent.replyTo).populate("author");
      } catch (err) {
        console.error("Error resolving comment replyTo", err);
        return null;
      }
    },
  },

  Notification: {
    id: (parent) => parent?.notificationId || resolveId(parent),
  },

  User: {
    id: resolveId,
    followers: async (parent) => {
      const targetId = parent.id || parent._id;
      if (!targetId) return [];

      try {
        const connections = await Connection.find({
          followee: targetId,
        }).populate("follower");

        return connections
          .map((connection) => connection.follower)
          .filter(Boolean);
      } catch (err) {
        console.error("Error resolving followers", err);
        return [];
      }
    },

    following: async (parent) => {
      const targetId = parent.id || parent._id;
      if (!targetId) return [];

      try {
        const connections = await Connection.find({
          follower: targetId,
        }).populate("followee");

        return connections
          .map((connection) => connection.followee)
          .filter(Boolean);
      } catch (err) {
        console.error("Error resolving following", err);
        return [];
      }
    },

    buddies: async (parent) => {
      const targetId = parent.id || parent._id;
      if (!targetId) return [];

      try {
        const connections = await Connection.find({
          follower: targetId,
          isBuddy: true,
        }).populate("followee");

        return connections
          .map((connection) => connection.followee)
          .filter(Boolean);
      } catch (err) {
        console.error("Error resolving buddies", err);
        return [];
      }
    },

    followersCount: async (parent) => {
      const targetId = parent.id || parent._id;
      if (!targetId) return 0;

      try {
        return await Connection.countDocuments({ followee: targetId });
      } catch (err) {
        console.error("Error resolving followersCount", err);
        return 0;
      }
    },

    followingCount: async (parent) => {
      const targetId = parent.id || parent._id;
      if (!targetId) return 0;

      try {
        return await Connection.countDocuments({ follower: targetId });
      } catch (err) {
        console.error("Error resolving followingCount", err);
        return 0;
      }
    },

    buddiesCount: async (parent) => {
      const targetId = parent.id || parent._id;
      if (!targetId) return 0;

      try {
        return await Connection.countDocuments({
          follower: targetId,
          isBuddy: true,
        });
      } catch (err) {
        console.error("Error resolving buddiesCount", err);
        return 0;
      }
    },

    isFollowedByViewer: async (parent, _, { currentUser }) => {
      const targetId = parent.id || parent._id;
      if (!currentUser?._id || !targetId || currentUser._id.equals(targetId)) {
        return false;
      }

      try {
        const existing = await Connection.exists({
          follower: currentUser._id,
          followee: targetId,
        });

        return Boolean(existing);
      } catch (err) {
        console.error("Error resolving isFollowedByViewer", err);
        return false;
      }
    },

    isBuddyWithViewer: async (parent, _, { currentUser }) => {
      const targetId = parent.id || parent._id;
      if (!currentUser?._id || !targetId || currentUser._id.equals(targetId)) {
        return false;
      }

      try {
        const connection = await Connection.findOne({
          follower: currentUser._id,
          followee: targetId,
        });

        return Boolean(connection?.isBuddy);
      } catch (err) {
        console.error("Error resolving isBuddyWithViewer", err);
        return false;
      }
    },

    closestCity: async (parent) => {
      if (parent.closestCity && parent.closestCity.name) {
        return parent.closestCity;
      }

      if (parent.closestCity) {
        try {
          const cityId = parent.closestCity._id || parent.closestCity;
          return await City.findById(cityId);
        } catch (err) {
          console.error("Error resolving closestCity by id", err);
        }
      }

      if (parent.lat == null || parent.long == null) {
        return null;
      }

      try {
        return await findClosestCity(parent.lat, parent.long);
      } catch (err) {
        console.error("Error resolving closestCity", err);
        return null;
      }
    },
  },

  Picture: {
    id: resolveId,
  },
};

module.exports = { typeDefs, resolvers };
