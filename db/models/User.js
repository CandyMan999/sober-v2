const mongoose = require("mongoose");
const Connection = require("./Connection");

const UserSchema = new mongoose.Schema(
  {
    // Device push token – still your core identifier, no password/signup.
    token: {
      type: String,
      required: false,
      unique: true,
      index: true,
      sparse: true,
    },

    appleId: {
      type: String,
      unique: true,
      sparse: true,
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

    // Average relapse day calculated from the streak history (in days)
    averageRelapseDay: {
      type: Number,
    },

    // Track when relapse reminders are sent to avoid duplicate pushes
    relapseReminderLastSentAt: {
      type: Date,
    },
    relapseReminderStartAt: {
      type: Date,
    },

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

    notificationSettings: {
      allPushEnabled: { type: Boolean, default: false },
      otherUserMilestones: { type: Boolean, default: true },
      otherUserComments: { type: Boolean, default: true },
      followingPosts: { type: Boolean, default: true },
      buddiesNearVenue: { type: Boolean, default: true },
      dailyPush: { type: Boolean, default: true },
      locationTrackingEnabled: { type: Boolean, default: true },
    },

    plan: {
      planType: {
        type: String,
        enum: [
          "Free", // No active RC entitlements detected
          "Premium", // RevenueCat entitlement: "premium"
          "Unlimited", // Future higher-tier RC entitlement (e.g., "unlimited")
        ],
        default: "Free",
      },

      // =======================
      // FUTURE à la carte items
      // =======================

      // Workbook purchase → maps to RC entitlement: "workbook"
      // Product ID (future): com.sobermotivation.workbook
      withWorkBook: {
        type: Boolean,
        default: false,
      },

      // Therapy add-on → maps to RC entitlement: "therapy"
      // Product ID (future): com.sobermotivation.therapy.monthly
      withTherapy: {
        type: Boolean,
        default: false,
      },

      // Ads toggle → likely controlled by planType === "Free"
      // If Premium or Unlimited → withAds becomes false automatically
      withAds: {
        type: Boolean,
        default: true,
      },
    },
    // Saved posts for quick access
    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],

    // Saved quotes for future inspiration
    savedQuotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quote",
      },
    ],

    // For timing pushes at correct local day.
    timezone: {
      type: String,
      default: "America/Chicago",
    },

    // Persisted chat room message style preset for consistent theming
    chatRoomStyle: {
      type: Number,
      min: 0,
      max: 9,
      default: () => Math.floor(Math.random() * 10),
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user document always has a chat room style assigned
UserSchema.methods.ensureChatRoomStyle = async function () {
  const hasStyle = typeof this.chatRoomStyle === "number";

  if (!hasStyle) {
    this.chatRoomStyle = Math.floor(Math.random() * 10);
    try {
      await this.save();
    } catch (err) {
      console.error("Failed to persist chatRoomStyle for user", this._id, err);
    }
  }

  return this.chatRoomStyle;
};

UserSchema.statics.ensureChatRoomStyle = async function (userDoc) {
  if (!userDoc || typeof userDoc.ensureChatRoomStyle !== "function")
    return null;
  return userDoc.ensureChatRoomStyle();
};

// Recalculate followers/following/buddies counts for the provided user
UserSchema.statics.recalcSocialCounts = async function (userId) {
  // Filter out orphaned connections (e.g., when a user was deleted)
  const [followers, following, buddies] = await Promise.all([
    Connection.find({ followee: userId }).populate("follower", "_id"),
    Connection.find({ follower: userId }).populate("followee", "_id"),
    Connection.find({
      isBuddy: true,
      $or: [{ follower: userId }, { followee: userId }],
    }).populate(["follower", "followee"]),
  ]);

  const invalidFollowerConnections = followers
    .filter((conn) => !conn.follower?._id)
    .map((conn) => conn._id);
  const invalidFollowingConnections = following
    .filter((conn) => !conn.followee?._id)
    .map((conn) => conn._id);

  const invalidConnectionIds = [
    ...invalidFollowerConnections,
    ...invalidFollowingConnections,
  ];

  if (invalidConnectionIds.length) {
    await Connection.deleteMany({ _id: { $in: invalidConnectionIds } });
  }

  const followersCount = followers.length - invalidFollowerConnections.length;
  const followingCount = following.length - invalidFollowingConnections.length;

  const buddyIds = buddies.reduce((set, conn) => {
    const otherSide = conn.follower?._id?.equals(userId)
      ? conn.followee?._id
      : conn.follower?._id;

    if (otherSide) {
      set.add(otherSide.toString());
    }

    return set;
  }, new Set());

  const buddiesCount = buddyIds.size;

  await this.findByIdAndUpdate(userId, {
    followersCount,
    followingCount,
    buddiesCount,
  });

  return { followersCount, followingCount, buddiesCount };
};

module.exports = mongoose.model("User", UserSchema);
