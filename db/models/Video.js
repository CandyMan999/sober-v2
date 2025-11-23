// models/Video.js
const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema({
  url: { type: String },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  flagged: { type: Boolean, default: false },
  viewed: { type: Boolean, default: false },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  publicId: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Video", VideoSchema);
