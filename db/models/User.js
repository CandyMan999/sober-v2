const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    // Device push token – still your core identifier, no password/signup.
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    username: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 32,
    },

    // Reference to a Picture document (profile avatar)
    profilePic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Picture",
    },

    // Optional: denormalized URL for quick reads
    profilePicUrl: {
      type: String,
    },

    // ========= SOBRIETY TRACKING =========

    // When the CURRENT sobriety streak started.
    // If user resets their date, you update this.
    sobrietyStartAt: {
      type: Date,
    },

    // --- Social links (optional) ---
    social: {
      instagram: { type: String, trim: true }, // handle or full URL
      tiktok: { type: String, trim: true },
      x: { type: String, trim: true }, // twitter/“X”
    },

    // Optional relapse history – so you can show "previous streaks" later.
    relapses: [
      {
        at: { type: Date, required: true },
        note: { type: String, trim: true },
      },
    ],

    // Which milestones we've already sent push notifications for, e.g. [1, 3, 7, 30]
    milestonesNotified: [
      {
        type: Number, // days sober
      },
    ],

    // Can user receive milestone notifications?
    milestoneNotificationsEnabled: {
      type: Boolean,
      default: true,
    },

    // For timing pushes at correct local day.
    timezone: {
      type: String,
      default: "America/Chicago",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema);
