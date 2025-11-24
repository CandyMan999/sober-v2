const {
  directUploadResolver,
  addPictureResolver,
  deletePhotoResolver,
} = require("./photo");
const { updateUserProfileResolver } = require("./updateUserProfile");
const { resetSobrietyDateResolver } = require("./resetSobrietyDate");
const { addQuoteResolver } = require("./quote");
const { sendPostResolver } = require("./sendPost");

module.exports = {
  directUploadResolver,
  addPictureResolver,
  deletePhotoResolver,
  updateUserProfileResolver,
  resetSobrietyDateResolver,
  addQuoteResolver,
  sendPostResolver,
};
