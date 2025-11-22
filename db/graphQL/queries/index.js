const { fetchMeResolver } = require("./fetch");
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
};
