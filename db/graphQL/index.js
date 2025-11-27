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
  setPostReviewResolver,
  creatingPostCommentResolver,
  createQuoteCommentResolver,
  toggleLikeResolver,
  recordPostViewResolver,
  followUserResolver,
  unfollowUserResolver,
} = require("./mutations/index.js");

const {
  fetchMeResolver,
  runPushResolver,
  getBarLocationResolver,
  getLiquorLocationResolver,
  addVenueResolver,
  getVenuesResolver,
  getQuotesResolver,
  getAllPostsResolver,
  profileOverviewResolver,
} = require("./queries/index.js");

// Import models
const { Like, Comment, Connection } = require("../models"); // ensure Like is exported from ../models/index.js

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

const resolvers = {
  Query: {
    fetchMe: fetchMeResolver,
    getVenues: getVenuesResolver,
    getBarLocation: getBarLocationResolver,
    getLiquorLocation: getLiquorLocationResolver,
    runPush: runPushResolver,
    getQuotes: getQuotesResolver,
    getAllPosts: getAllPostsResolver,
    profileOverview: profileOverviewResolver,
  },

  Mutation: {
    directUpload: directUploadResolver,
    addPicture: addPictureResolver,
    deletePhoto: deletePhotoResolver,
    updateUserProfile: updateUserProfileResolver,
    addVenue: addVenueResolver,
    resetSobrietyDate: resetSobrietyDateResolver,
    addQuote: addQuoteResolver,
    sendPost: sendPostResolver,
    sendImagePost: sendImagePostResolver,
    setPostReview: setPostReviewResolver,
    createPostComment: creatingPostCommentResolver,
    createQuoteComment: createQuoteCommentResolver,
    toggleLike: toggleLikeResolver,
    recordPostView: recordPostViewResolver,
    followUser: followUserResolver,
    unfollowUser: unfollowUserResolver,
  },

  Upload: require("graphql-upload-minimal").GraphQLUpload,

  // ---- Type-level resolvers ----
  Quote: {
    likes: resolveLikes("QUOTE"),
  },

  Post: {
    likes: resolveLikes("POST"),
    viewsCount: (parent) => parent?.video?.viewsCount ?? 0,
  },

  Comment: {
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

  User: {
    followers: async (parent) => {
      const targetId = parent.id || parent._id;
      if (!targetId) return [];

      try {
        const connections = await Connection.find({ followee: targetId }).populate(
          "follower"
        );

        return connections.map((connection) => connection.follower).filter(Boolean);
      } catch (err) {
        console.error("Error resolving followers", err);
        return [];
      }
    },

    following: async (parent) => {
      const targetId = parent.id || parent._id;
      if (!targetId) return [];

      try {
        const connections = await Connection.find({ follower: targetId }).populate(
          "followee"
        );

        return connections.map((connection) => connection.followee).filter(Boolean);
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

        return connections.map((connection) => connection.followee).filter(Boolean);
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
        return await Connection.countDocuments({ follower: targetId, isBuddy: true });
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
  },
};

module.exports = { typeDefs, resolvers };
