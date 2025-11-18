const rootDefs = require("./rootDefs.js");

const {
  addPictureResolver,
  directUploadResolver,
  updateUserProfileResolver,
} = require("./mutations");

const typeDefs = [rootDefs];

const resolvers = {
  Query: {},
  Mutation: {
    directUpload: directUploadResolver,
    addPicture: addPictureResolver,
    updateUserProfile: updateUserProfileResolver,
  },
};

module.exports = { typeDefs, resolvers };
