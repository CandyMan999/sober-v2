const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema({
  url: { type: String },
  sender: { type: mongoose.Schema.ObjectId, ref: "User" },
  flagged: { type: Boolean, default: false },
  viewed: { type: Boolean, default: false },
  receiver: { type: mongoose.Schema.ObjectId, ref: "User" },
  comment: { type: mongoose.Schema.ObjectId, ref: "Comment" },
  publicId: { type: String },
  createdAt: {
    type: Date,

    // expires: 14800,
    default: Date.now,
  },
});

module.exports = mongoose.model("Video", VideoSchema);
