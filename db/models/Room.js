const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    users: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // For group chat vs DM
    isDirect: {
      type: Boolean,
      default: false,
    },

    // Participants in this room (for DM, length === 2)

    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    // helpful for listing & sorting threads
    lastMessageAt: {
      type: Date,
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Room", RoomSchema);
