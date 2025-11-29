const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: function requiredName() {
        // Direct message rooms don't need a custom name
        return !this.isDirect;
      },
    },

    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
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
