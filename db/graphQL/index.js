const rootDefs = require("./rootDefs.js");

const {
  addPictureResolver,
  directUploadResolver,
  deletePhotoResolver,
  updateUserProfileResolver,
  resetSobrietyDateResolver,
  addQuoteResolver,
} = require("./mutations/index.js");

const {
  fetchMeResolver,
  runPushResolver,
  getBarLocationResolver,
  getLiquorLocationResolver,
  addVenueResolver,
  getVenuesResolver,
  getQuotesResolver,
} = require("./queries/index.js");

// Import models
const { Like } = require("../models"); // ensure Like is exported from ../models/index.js

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
  },

  Mutation: {
    directUpload: directUploadResolver,
    addPicture: addPictureResolver,
    deletePhoto: deletePhotoResolver,
    updateUserProfile: updateUserProfileResolver,
    addVenue: addVenueResolver,
    resetSobrietyDate: resetSobrietyDateResolver,
    addQuote: addQuoteResolver,
  },

  // ---- Type-level resolvers ----
  Quote: {
    likes: resolveLikes("QUOTE"),
  },

  Post: {
    likes: resolveLikes("POST"),
  },
};

module.exports = { typeDefs, resolvers };
