// models/Connection.js
const mongoose = require("mongoose");

const ConnectionSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Optional: cache mutual state so you don't recompute every time
    isBuddy: {
      type: Boolean,
      default: false, // true when both directions exist
    },
  },
  {
    timestamps: true,
  }
);

// One directional follow per pair
ConnectionSchema.index({ follower: 1, followee: 1 }, { unique: true });

// Fast lookups
ConnectionSchema.index({ follower: 1 });
ConnectionSchema.index({ followee: 1 });
ConnectionSchema.index({ isBuddy: 1 });

module.exports = mongoose.model("Connection", ConnectionSchema);
