const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema(
  {
    url: {
      type: String,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    flagged: {
      type: Boolean,
      default: false,
    },

    // Array of unique viewers (user ids)
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    post: { type: mongoose.Schema.ObjectId, ref: "Post" },

    // Fast counter for how many unique viewers
    viewsCount: {
      type: Number,
      default: 0,
    },

    thumbnailUrl: {
      type: String,
      default: null,
    },

    publicId: {
      type: String,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // gives you createdAt/updatedAt automatically
  }
);

// Optional: index if you ever query by sender a lot
VideoSchema.index({ sender: 1, createdAt: -1 });

module.exports = mongoose.model("Video", VideoSchema);
