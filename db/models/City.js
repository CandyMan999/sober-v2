const mongoose = require("mongoose");

const CitySchema = new mongoose.Schema({
  name: { type: String },
  bars: [{ type: mongoose.Schema.ObjectId, ref: "Venue" }],
  liquor: [{ type: mongoose.Schema.ObjectId, ref: "Venue" }],
  lat: {
    type: Number,
  },
  long: {
    type: Number,
  },
});

module.exports = mongoose.model("City", CitySchema);
