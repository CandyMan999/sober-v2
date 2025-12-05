const mongoose = require("mongoose");
const { Venue, City } = require("../models");
const { data } = require("./barsAndLiquor"); // add data to this file whenever you want to add new bars or liqour stores.
require("dotenv").config();

const { removeDuplicates, getDistanceFromCoords } = require("../utils/helpers");

const addNewBars = async () => {
  await mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("DB connected"))
    .catch((err) => console.log(err));

  //Example of seedData structure
  // {
  //   type: "Liquor",
  //   name: "Mead's Retail Liquor Store",
  //   lat: 38.3698483,
  //   long: -97.6830878,
  // },
  // {
  //   type: "Liquor",
  //   name: "Top Hat Retail Liquor Inc ",
  //   lat: 39.1174572,
  //   long: -94.7642906,
  // },
  // { type: "Liquor", name: "Bing Brothers", lat: 37.236013, long: -96.996784 }

  let seedData = data; //put seed data, don't forget to make sure type is "Bar" or "Liqour"

  // helper: find closest city
  const findClosestCity = async (lat, long) => {
    let shortestDistance = null;
    let currentDistance = null;
    let cityName = null;
    let cityId = null;

    const cities = await City.find();

    for (const city of cities) {
      const cityLat = city.lat;
      const cityLng = city.long;

      currentDistance = await getDistanceFromCoords(
        lat,
        long,
        cityLat,
        cityLng
      );

      if (shortestDistance === null || currentDistance < shortestDistance) {
        shortestDistance = currentDistance;
        cityName = city.name;
        cityId = city._id;
      }
    }

    return { cityName, cityId };
  };

  // helper: check if a venue with same lat/long already exists
  const isDuplicateVenue = async (lat, long) => {
    return Venue.findOne({ lat, long });
  };

  let resumeIndex = 0;

  try {
    seedData = await removeDuplicates(seedData);

    for (let i = 0; i < seedData.length; i++) {
      resumeIndex = i; // track progress in case you still want the catch logic

      const { lat, long, name, type } = seedData[i];

      // --- DUPLICATE CHECK HERE ---
      const existingVenue = await isDuplicateVenue(lat, long);
      if (existingVenue) {
        console.log(
          `Skipping duplicate [index ${i}]: "${name}" has same coords as existing venue "${existingVenue.name}" (lat: ${lat}, long: ${long})`
        );
        continue; // skip creating / linking to city
      }

      const { cityId } = await findClosestCity(lat, long);
      const city = await City.findById(cityId);

      if (!city) {
        console.log(
          `No city found for venue [index ${i}] "${name}" (lat: ${lat}, long: ${long}). Skipping.`
        );
        continue;
      }

      const venue = await Venue.create({
        name,
        type,
        lat,
        long,
        city,
      });

      await City.findOneAndUpdate(
        { _id: city._id },
        { $push: { bars: venue } },
        { new: true }
      );

      console.log(`Created venue [index ${i}]: ${venue.name} in ${city.name}`);
    }
  } catch (error) {
    console.error("Error while seeding venues:", error);

    // optional: if you *really* want to try to resume from where it crashed:
    try {
      console.log(`Attempting to resume from index ${resumeIndex}...`);

      seedData = await removeDuplicates(seedData);

      for (let i = resumeIndex; i < seedData.length; i++) {
        const { lat, long, name, type } = seedData[i];

        const existingVenue = await isDuplicateVenue(lat, long);
        if (existingVenue) {
          console.log(
            `Skipping duplicate [index ${i}]: "${name}" has same coords as existing venue "${existingVenue.name}" (lat: ${lat}, long: ${long})`
          );
          continue;
        }

        const { cityId } = await findClosestCity(lat, long);
        const city = await City.findById(cityId);

        if (!city) {
          console.log(
            `No city found for venue [index ${i}] "${name}" (lat: ${lat}, long: ${long}). Skipping.`
          );
          continue;
        }

        const venue = await Venue.create({
          name,
          type,
          lat,
          long,
          city,
        });

        await City.findOneAndUpdate(
          { _id: city._id },
          { $push: { bars: venue } },
          { new: true }
        );

        console.log(
          `Created venue [index ${i}]: ${venue.name} in ${city.name} (resume)`
        );
      }
    } catch (resumeError) {
      console.error("Error while resuming venue seed:", resumeError);
    }
  } finally {
    await mongoose.disconnect();
  }
};

addNewBars();
