const rootDefs = require("./rootDefs.js");

const {
  addPictureResolver,
  directUploadResolver,
  deletePhotoResolver,
  updateUserProfileResolver,
  resetSobrietyDateResolver,
} = require("./mutations/index.js");
const {
  fetchMeResolver,
  runPushResolver,
  getBarLocationResolver,
  getLiquorLocationResolver,
  addVenueResolver,
  getVenuesResolver,
} = require("./queries/index.js");

const typeDefs = [rootDefs];

const resolvers = {
  Query: {
    fetchMe: fetchMeResolver,
    getVenues: getVenuesResolver,
    getBarLocation: getBarLocationResolver,
    getLiquorLocation: getLiquorLocationResolver,
    runPush: runPushResolver,
  },
  Mutation: {
    directUpload: directUploadResolver,
    addPicture: addPictureResolver,
    deletePhoto: deletePhotoResolver,
    updateUserProfile: updateUserProfileResolver,
    addVenue: addVenueResolver,
    resetSobrietyDate: resetSobrietyDateResolver,
  },
};

module.exports = { typeDefs, resolvers };
