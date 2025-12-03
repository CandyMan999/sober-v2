const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    notificationId: { type: String, required: true },
    type: { type: String },
    title: { type: String },
    description: { type: String },
    intent: { type: String },
    postId: { type: String },
    quoteId: { type: String },
    commentId: { type: String },
    milestoneDays: { type: Number },
    milestoneTag: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    read: { type: Boolean, default: false },
    dismissed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, notificationId: 1 }, { unique: true });

module.exports = mongoose.model("Notification", NotificationSchema);
