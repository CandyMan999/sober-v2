// models/Post.js
const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      default: "",
    },

    mediaType: {
      type: String,
      enum: ["VIDEO", "IMAGE"],
      default: "VIDEO",
    },

    // Reference to existing Video model
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      default: null,
    },

    imageUrl: {
      type: String,
      default: null,
    },

    imagePublicId: {
      type: String,
      default: null,
    },

    flagged: {
      type: Boolean,
      default: false,
    },

    review: {
      type: Boolean,
      default: false,
    },

    // Milestone-specific metadata
    isMilestone: {
      type: Boolean,
      default: false,
    },

    lat: {
      type: Number,
      default: null,
    },
    long: {
      type: Number,
      default: null,
    },

    closestCity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      default: null,
    },

    milestoneDays: {
      type: Number,
      default: null,
    },

    milestoneTag: {
      type: String,
      default: null,
    },

    // Comments (referenced)
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    commentsCount: {
      type: Number,
      default: 0,
    },

    // Like count only – actual Like docs live in Like collection
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

module.exports = mongoose.model("Post", PostSchema);
