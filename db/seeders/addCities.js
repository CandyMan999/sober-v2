const mongoose = require("mongoose");
const { Venue, City } = require("../models");
const { CITIES } = require("./cities"); // later do world list
require("dotenv").config();

const addCities = async () => {
  await mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("DB connected"))
    .catch((err) => console.log(err));

  const existingCities = await City.find();
  if (existingCities.length) {
    await City.collection.drop();
  }

  await Venue.collection.drop();

  for (let i = 0; i < CITIES.length; i++) {
    const seed = {
      name: CITIES[i].city || CITIES[i].name,
      lat: CITIES[i].latitude || CITIES[i].location.latitude,
      long: CITIES[i].longitude || CITIES[i].location.longitude,
    };

    const data = await City.create(seed);
    console.log(data.name);
  }

  process.exit(0);
};

addCities();
module.exports = { addCities };
