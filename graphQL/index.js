const rootDefs = require("./rootDefs.js");

const {
  addPictureResolver,
  directUploadResolver,
  deletePhotoResolver,
  updateUserProfileResolver,
} = require("./mutations");
const { fetchMeResolver } = require("./queries");

const typeDefs = [rootDefs];

const resolvers = {
  Query: { fetchMe: fetchMeResolver },
  Mutation: {
    directUpload: directUploadResolver,
    addPicture: addPictureResolver,
    deletePhoto: deletePhotoResolver,
    updateUserProfile: updateUserProfileResolver,
  },
};

module.exports = { typeDefs, resolvers };
