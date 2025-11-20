const rootDefs = require("./rootDefs.js");

const {
  addPictureResolver,
  directUploadResolver,
  deletePhotoResolver,
  updateUserProfileResolver,
} = require("./mutations");

const typeDefs = [rootDefs];

const resolvers = {
  Query: {},
  Mutation: {
    directUpload: directUploadResolver,
    addPicture: addPictureResolver,
    deletePhoto: deletePhotoResolver,
    updateUserProfile: updateUserProfileResolver,
  },
};

module.exports = { typeDefs, resolvers };
