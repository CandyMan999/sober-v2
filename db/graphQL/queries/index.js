const { fetchMeResolver, getQuotesResolver, getAllPostsResolver } = require("./fetch");
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
};
