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

    // Optional: "day one" / drinking days photo for before/after comparisons
    drunkPic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Picture",
    },

    drunkPicUrl: {
      type: String,
    },

    // Personal motivation for sobriety
    whyStatement: {
      type: String,
      trim: true,
    },

    // ========= SOBRIETY TRACKING =========

    // When the CURRENT sobriety streak started.
    // If user resets their date, you update this.
    sobrietyStartAt: {
      type: Date,
    },

    // --- Social links (optional) ---
    social: {
      instagram: {
        handle: { type: String, trim: true },
        deeplink: {
          app: { type: String, trim: true },
          web: { type: String, trim: true },
        },
        website: { type: String, trim: true },
        verified: { type: Boolean, default: false },
      },
      tiktok: {
        handle: { type: String, trim: true },
        deeplink: {
          app: { type: String, trim: true },
          web: { type: String, trim: true },
        },
        website: { type: String, trim: true },
        verified: { type: Boolean, default: false },
      },
      x: {
        handle: { type: String, trim: true }, // twitter/“X”
        deeplink: {
          app: { type: String, trim: true },
          web: { type: String, trim: true },
        },
        website: { type: String, trim: true },
        verified: { type: Boolean, default: false },
      },
    },

    // Last known device location (helps with venue alerts)
    lat: {
      type: Number,
    },
    long: {
      type: Number,
    },

    //  relapse history – so you can show "previous streaks"
    streaks: [
      {
        startAt: {
          type: Date,
          required: true,
        },
        // When this streak ended (relapse/reset)
        endAt: {
          type: Date,
          required: true,
        },
      },
    ],

    buddiesCount: {
      type: Number,
      default: 0,
    },
    followersCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },

    // Which milestones we've already sent push notifications for, e.g. [1, 3, 7, 30]
    milestonesNotified: [
      {
        type: Number, // days sober
      },
    ],

    // Can user receive milestone notifications?
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },

    // Saved posts for quick access
    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],

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
