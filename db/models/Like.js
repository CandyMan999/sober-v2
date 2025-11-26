// models/Like.js
const mongoose = require("mongoose");

const LikeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // What this like is attached to (must match GraphQL LikeTarget)
    targetType: {
      type: String,
      enum: ["QUOTE", "POST", "COMMENT"],
      required: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

// Ensure one like per user per target
LikeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model("Like", LikeSchema);
