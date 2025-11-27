// models/Quote.js
const mongoose = require("mongoose");

const QuoteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    isDenied: {
      type: Boolean,
      default: false,
    },

    isUsed: {
      type: Boolean,
      default: false,
    },

    // Who posted it (optional — system quotes won't have a user)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

    // Like count only – real likes live in Like collection
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

module.exports = mongoose.model("Quote", QuoteSchema);
