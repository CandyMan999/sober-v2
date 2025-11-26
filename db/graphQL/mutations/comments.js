const mongoose = require("mongoose");
const { AuthenticationError, UserInputError } = require("apollo-server-express");
const { Comment, Post, Quote, User } = require("../../models");
const { sendPushNotifications } = require("../../utils/pushNotifications");

const buildRepliesPopulate = (depth = 1) => {
  const populate = [
    { path: "author" },
    { path: "replyTo", populate: { path: "author" } },
  ];

  if (depth > 0) {
    populate.push({
      path: "replies",
      populate: buildRepliesPopulate(depth - 1),
    });
  }

  return populate;
};

const creatingPostCommentResolver = async (_, args) => {
  const { token, postId, text, replyTo = null } = args;

  if (!text || !text.trim()) {
    throw new UserInputError("Comment text is required");
  }

  const user = await User.findOne({ token });
  if (!user) {
    throw new AuthenticationError("Invalid token");
  }

  let targetType = "POST";
  let target = await Post.findById(postId).populate("author");

  // Allow quotes to use the same mutation while we add a dedicated one later
  if (!target) {
    target = await Quote.findById(postId).populate("user");
    targetType = target ? "QUOTE" : targetType;
  }

  if (!target) {
    throw new UserInputError("Post or quote not found");
  }

  const replyToId = replyTo ? new mongoose.Types.ObjectId(replyTo) : null;

  const newComment = await Comment.create({
    text: text.trim(),
    author: user._id,
    targetType,
    targetId: target._id,
    replyTo: replyToId,
  });

  if (replyToId) {
    const parent = await Comment.findById(replyToId);
    if (parent) {
      parent.replies.push(newComment._id);
      await parent.save();
    }
  }

  if (targetType === "POST") {
    target.comments.push(newComment._id);
    target.commentsCount = (target.commentsCount || 0) + 1;
    await target.save();
  } else if (targetType === "QUOTE") {
    target.comments.push(newComment._id);
    target.commentsCount = (target.commentsCount || 0) + 1;
    await target.save();
  }

  await newComment.populate(buildRepliesPopulate(0));

  const notifications = [];
  const actorName = user.username || "Someone";
  const trimmedBody = text.trim();

  const targetOwner =
    targetType === "POST" ? target.author : target?.user ?? null;

  if (
    targetOwner &&
    targetOwner.token &&
    targetOwner.notificationsEnabled !== false &&
    String(targetOwner._id) !== String(user._id)
  ) {
    const title = `${actorName} commented on your ${
      targetType === "QUOTE" ? "quote" : "post"
    }`;

    const ownerNotificationData = {
      type: targetType === "QUOTE" ? "quote_comment" : "post_comment",
      targetType,
      targetId: String(target._id),
      commentId: String(newComment._id),
    };

    if (targetType === "POST") ownerNotificationData.postId = String(target._id);
    if (targetType === "QUOTE") ownerNotificationData.quoteId = String(target._id);

    notifications.push({
      pushToken: targetOwner.token,
      title,
      body: trimmedBody,
      data: ownerNotificationData,
    });
  }

  if (replyToId) {
    const parent = await Comment.findById(replyToId).populate("author");

    if (
      parent?.author &&
      parent.author.token &&
      parent.author.notificationsEnabled !== false &&
      String(parent.author._id) !== String(user._id)
    ) {
      const title = `${actorName} replied to your comment`;

      const replyNotificationData = {
        type: "comment_reply",
        targetType,
        targetId: String(target._id),
        commentId: String(newComment._id),
        parentCommentId: String(parent._id),
      };

      if (targetType === "POST") replyNotificationData.postId = String(target._id);
      if (targetType === "QUOTE") replyNotificationData.quoteId = String(target._id);

      notifications.push({
        pushToken: parent.author.token,
        title,
        body: trimmedBody,
        data: replyNotificationData,
      });
    }
  }

  const dedupedNotifications = [];
  const seen = new Set();

  for (const notification of notifications) {
    const key = `${notification.pushToken}-${notification?.data?.type || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    dedupedNotifications.push(notification);
  }

  await sendPushNotifications(dedupedNotifications);

  newComment.replies = newComment.replies || [];
  return newComment;
};

module.exports = {
  creatingPostCommentResolver,
};
