const {
  fetchMeResolver,
  getQuotesResolver,
  getAllPostsResolver,
  profileOverviewResolver,
  userProfileResolver,
} = require("./fetch");
const {
  getBarLocationResolver,
  getLiquorLocationResolver,
  getVenuesResolver,
  addVenueResolver,
  runPushResolver,
} = require("./venues");

module.exports = {
  fetchMeResolver,
  getBarLocationResolver,
  getLiquorLocationResolver,
  getVenuesResolver,
  addVenueResolver,
  runPushResolver,
  getQuotesResolver,
  getAllPostsResolver,
  profileOverviewResolver,
  userProfileResolver,
};
