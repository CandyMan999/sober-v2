const { City } = require("../models");
const { getDistanceFromCoords } = require("./helpers");

/**
 * Finds the closest city to the provided coordinates.
 * Returns the City document or null if coords are missing or no cities exist.
 */
const findClosestCity = async (lat, long) => {
  if (lat === null || lat === undefined || long === null || long === undefined) {
    return null;
  }

  const cities = await City.find({}, { name: 1, lat: 1, long: 1 });
  if (!cities || cities.length === 0) {
    return null;
  }

  let closest = null;
  let shortestDistance = null;

  for (const city of cities) {
    if (city.lat === undefined || city.lat === null || city.long === undefined || city.long === null) {
      continue;
    }

    const distance = getDistanceFromCoords(lat, long, city.lat, city.long);

    if (shortestDistance === null || distance < shortestDistance) {
      shortestDistance = distance;
      closest = city;
    }
  }

  return closest;
};

module.exports = {
  findClosestCity,
};
