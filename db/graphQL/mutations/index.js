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
const { deletePostResolver, deleteQuoteResolver } = require("./deleteContent");
const { setPostReviewResolver } = require("./review");
const {
  creatingPostCommentResolver,
  createQuoteCommentResolver,
} = require("./comments");
const { toggleLikeResolver } = require("./likes");
const { recordPostViewResolver } = require("./views");
const { followUserResolver, unfollowUserResolver } = require("./follow");
const { updateSocialResolver } = require("./updateSocial");
const { sendDirectMessageResolver, setDirectTypingResolver } = require("./directMessage");
const { toggleSaveResolver } = require("./save");

module.exports = {
  directUploadResolver,
  addPictureResolver,
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
  followUserResolver,
  unfollowUserResolver,
  updateSocialResolver,
  sendDirectMessageResolver,
  setDirectTypingResolver,
};
