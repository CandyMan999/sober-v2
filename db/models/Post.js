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

    // Reference to existing Video model
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      default: null,
    },

    flagged: {
      type: Boolean,
      default: false,
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
