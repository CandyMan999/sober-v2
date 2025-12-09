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
const {
  sendDirectMessageResolver,
  setDirectTypingResolver,
  deleteDirectRoomResolver,
  markDirectRoomReadResolver,
  therapyChatResolver,
} = require("./directMessage");
const {
  createRoomResolver,
  changeRoomResolver,
  createCommentResolver,
  leaveAllRoomsResolver,
} = require("./rooms");
const { toggleSaveResolver } = require("./save");
const { moderatePostResolver, moderateQuoteResolver } = require("./moderation");
const { deleteAccountResolver } = require("./deleteUser");
const {
  markNotificationReadResolver,
  dismissNotificationResolver,
  clearAllNotificationsResolver,
  updateNotificationSettingsResolver,
  toggleNotificationCategoryResolver,
} = require("./notifications");
const { appleLoginResolver } = require("./appleLogin");

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
  moderatePostResolver,
  moderateQuoteResolver,
  recordPostViewResolver,
  followUserResolver,
  unfollowUserResolver,
  updateSocialResolver,
  sendDirectMessageResolver,
  setDirectTypingResolver,
  deleteDirectRoomResolver,
  markDirectRoomReadResolver,
  therapyChatResolver,
  createRoomResolver,
  changeRoomResolver,
  createCommentResolver,
  leaveAllRoomsResolver,
  markNotificationReadResolver,
  dismissNotificationResolver,
  clearAllNotificationsResolver,
  updateNotificationSettingsResolver,
  toggleNotificationCategoryResolver,
  deleteAccountResolver,
  appleLoginResolver,
};
