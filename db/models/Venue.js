const mongoose = require("mongoose");

const VenueSchema = new mongoose.Schema({
  type: { type: String, enum: ["Bar", "Liquor"], required: true },
  name: { type: String },
  lat: { type: Number, required: true },
  long: { type: Number, required: true },
  city: { type: mongoose.Schema.ObjectId, ref: "City" },
});

module.exports = mongoose.model("Venue", VenueSchema);
