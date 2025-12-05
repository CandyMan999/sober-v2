const mongoose = require("mongoose");

const VenueSchema = new mongoose.Schema({
  type: { type: String, enum: ["Bar", "Liquor"], required: true },
  name: { type: String },
  lat: { type: Number, required: true },
  long: { type: Number, required: true },
  city: { type: mongoose.Schema.ObjectId, ref: "City" },
});

// --- Prevent duplicate venues with same lat + long ---
VenueSchema.index({ lat: 1, long: 1 }, { unique: true });

module.exports = mongoose.model("Venue", VenueSchema);
