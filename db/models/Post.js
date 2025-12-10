// models/Post.js
const mongoose = require("mongoose");
const Like = require("./Like");
const Comment = require("./Comment");

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

    // Days sober (calculated from the author's sobrietyStartAt) at the time the
    // post was created. Enables filtering/searching by sobriety milestones
    // later on without recomputing historical values.
    daysSober: {
      type: Number,
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

    adminApproved: {
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

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: null,
      },
      coordinates: {
        type: [Number],
        default: null,
      },
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

    // Track unique viewers for non-video posts
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Fast counter for how many unique viewers
    viewsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

PostSchema.index({ location: "2dsphere" });

// Recalculate likes and comments for a post from Like/Comment collections
PostSchema.statics.recalcEngagement = async function (postId) {
  const [likesCount, commentsCount] = await Promise.all([
    Like.countDocuments({ targetType: "POST", targetId: postId }),
    Comment.countDocuments({ targetType: "POST", targetId: postId }),
  ]);

  await this.findByIdAndUpdate(postId, { likesCount, commentsCount });

  return { likesCount, commentsCount };
};

module.exports = mongoose.model("Post", PostSchema);
