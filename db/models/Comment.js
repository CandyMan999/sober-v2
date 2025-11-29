// models/Comment.js
const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },

    // Who wrote the comment
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // What content this comment belongs to
    //For DMs, targetType = "ROOM", targetId = roomId where that Room is flagged as isDirect: true.
    targetType: {
      type: String,
      enum: ["ROOM", "POST", "QUOTE"],
      required: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // Threading: if this is a reply, points to another Comment
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },

    // Optional: store children comment ids for fast population
    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],

    // lightweight like counter (actual Like docs stored separately)
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

module.exports = mongoose.model("Comment", CommentSchema);
