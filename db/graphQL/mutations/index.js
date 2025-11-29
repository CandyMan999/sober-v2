const {
  directUploadResolver,
  addPictureResolver,
  deletePhotoResolver,
} = require("./photo");
const { updateUserProfileResolver } = require("./updateUserProfile");
const { resetSobrietyDateResolver } = require("./resetSobrietyDate");
const { addQuoteResolver } = require("./quote");
const { sendPostResolver } = require("./sendPost");
const { sendImagePostResolver } = require("./sendImagePost");
const { setPostReviewResolver } = require("./review");
const {
  creatingPostCommentResolver,
  createQuoteCommentResolver,
} = require("./comments");
const { toggleLikeResolver } = require("./likes");
const { recordPostViewResolver } = require("./views");
const { followUserResolver, unfollowUserResolver } = require("./follow");
const { updateSocialResolver } = require("./updateSocial");
const { sendDirectMessageResolver } = require("./directMessage");

module.exports = {
  directUploadResolver,
  addPictureResolver,
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
  updateSocialResolver,
  sendDirectMessageResolver,
};
