const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { Venue, City } = require("../models");
const { data: manualSeedData = [] } = require("./barsAndLiquor");
require("dotenv").config();

const { removeDuplicates, getDistanceFromCoords } = require("../utils/helpers");

// 📂 Folder where runMap.js and all venues-*.json files live
const SCRAPED_DIR = path.join(__dirname, "..", "..", "Puppet");

// Load all venues from every `venues-*.json` file in SCRAPED_DIR
function loadScrapedVenues() {
  if (!fs.existsSync(SCRAPED_DIR)) {
    console.log(`⚠️ SCRAPED_DIR does not exist (${SCRAPED_DIR}).`);
    return [];
  }

  const files = fs
    .readdirSync(SCRAPED_DIR)
    .filter((f) => f.startsWith("venues-") && f.endsWith(".json"));

  if (!files.length) {
    console.log(`⚠️ No venues-*.json files found in ${SCRAPED_DIR}.`);
    return [];
  }

  let all = [];

  for (const file of files) {
    const fullPath = path.join(SCRAPED_DIR, file);
    try {
      const raw = fs.readFileSync(fullPath, "utf8");
      const json = JSON.parse(raw);

      if (Array.isArray(json)) {
        all = all.concat(json);
        console.log(`📥 Loaded ${json.length} venues from ${file}`);
      } else {
        console.warn(`⚠️ Skipping ${file}: JSON root is not an array.`);
      }
    } catch (err) {
      console.error(`❌ Error reading/parsing ${file}:`, err.message);
    }
  }

  console.log(
    `✅ Loaded a total of ${all.length} venues from ${files.length} scraped files.`
  );
  return all;
}

const addNewBars = async () => {
  await mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("DB connected"))
    .catch((err) => console.log(err));

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
    // 🔹 Load all scraped JSON + manual bars/liquor data
    let seedData = [...manualSeedData, ...loadScrapedVenues()];

    console.log(
      `🧮 Combined manualSeedData (${manualSeedData.length}) + scraped venues → ${seedData.length} total before dedupe.`
    );

    // Remove duplicates by your helper
    seedData = await removeDuplicates(seedData);
    console.log(`✅ After removeDuplicates: ${seedData.length} venues.`);

    for (let i = 0; i < seedData.length; i++) {
      resumeIndex = i; // track progress for resume logic

      const { lat, long, name, type } = seedData[i];

      if (typeof lat !== "number" || typeof long !== "number") {
        console.log(
          `⚠️ Skipping [index ${i}] "${name}" due to invalid coords: lat=${lat}, long=${long}`
        );
        continue;
      }

      const existingVenue = await isDuplicateVenue(lat, long);
      if (existingVenue) {
        console.log(
          `⏭  Skipping duplicate [index ${i}]: "${name}" has same coords as existing venue "${existingVenue.name}" (lat: ${lat}, long: ${long})`
        );
        continue;
      }

      const { cityId } = await findClosestCity(lat, long);
      const city = await City.findById(cityId);

      if (!city) {
        console.log(
          `⚠️ No city found for venue [index ${i}] "${name}" (lat: ${lat}, long: ${long}). Skipping.`
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
        `🍺 Created venue [${i}] (${type}) → "${venue.name}" in ${city.name}`
      );
    }
  } catch (error) {
    console.error("Error while seeding venues:", error);

    // optional: resume logic
    try {
      console.log(`🔁 Attempting to resume from index ${resumeIndex}...`);

      let seedData = [...manualSeedData, ...loadScrapedVenues()];

      seedData = await removeDuplicates(seedData);

      for (let i = resumeIndex; i < seedData.length; i++) {
        const { lat, long, name, type } = seedData[i];

        if (typeof lat !== "number" || typeof long !== "number") {
          console.log(
            `⚠️ Skipping [index ${i}] "${name}" due to invalid coords: lat=${lat}, long=${long}`
          );
          continue;
        }

        const existingVenue = await isDuplicateVenue(lat, long);
        if (existingVenue) {
          console.log(
            `⏭  Skipping duplicate [index ${i}]: "${name}" has same coords as existing venue "${existingVenue.name}" (lat: ${lat}, long: ${long})`
          );
          continue;
        }

        const { cityId } = await findClosestCity(lat, long);
        const city = await City.findById(cityId);

        if (!city) {
          console.log(
            `⚠️ No city found for venue [index ${i}] "${name}" (lat: ${lat}, long: ${long}). Skipping.`
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
          `✅ Created venue [index ${i}]: ${venue.name} in ${city.name} (resume)`
        );
      }
    } catch (resumeError) {
      console.error("❌ Error while resuming venue seed:", resumeError);
    }
  } finally {
    await mongoose.disconnect();
  }
};

addNewBars();
