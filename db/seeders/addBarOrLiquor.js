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

  let seedData = data; //put seed data, don't forget to make sure type is "Bar" or "Liqour"

  let newI;
  try {
    const findClosestCity = async (lat, long) => {
      let shortestDistance = null;
      let currentDistance = null;
      let cityName = null;
      let cityId = null;

      const cities = await City.find();

      await cities.map(async (city) => {
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
      });

      return { cityName, cityId };
    };

    seedData = await removeDuplicates(seedData);

    for (let i = 0; seedData.length > i; i++) {
      const city = await City.findOne({
        _id: (await findClosestCity(seedData[i].lat, seedData[i].long)).cityId,
      });

      const data = await Venue.create({
        name: seedData[i].name,
        type: seedData[i].type,
        lat: seedData[i].lat,
        long: seedData[i].long,
        city,
      });
      const updateCity = await City.findOneAndUpdate(
        { _id: city._id },
        { $push: { bars: data } },
        { new: true }
      );
      newI === i;

      console.log(i, data.name, city.name);
    }
  } catch (error) {
    if (error) {
      await mongoose
        .connect(process.env.MONGO_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        })
        .then(() => console.log("DB connected"))
        .catch((err) => console.log(err));
    }
    const findClosestCity = async (lat, long) => {
      let shortestDistance = null;
      let currentDistance = null;
      let cityName = null;
      let cityId = null;

      const cities = await City.find();

      await cities.map(async (city) => {
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
      });

      return { cityName, cityId };
    };

    seedData = await removeDuplicates(seedData);

    for (let i = newI; seedData.length > i; i++) {
      const city = await City.findOne({
        _id: (await findClosestCity(seedData[i].lat, seedData[i].long)).cityId,
      });

      const data = await Venue.create({
        name: seedData[i].name,
        type: seedData[i].type,
        lat: seedData[i].lat,
        long: seedData[i].long,
        city,
      });
      const updateCity = await City.findOneAndUpdate(
        { _id: city._id },
        { $push: { bars: data } },
        { new: true }
      );

      console.log(i, data.name, city.name);
    }
  }
};

addNewBars();
