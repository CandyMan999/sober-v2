const mongoose = require("mongoose");
const { AuthenticationError, UserInputError } = require("apollo-server-express");
const { Comment, Post, User } = require("../../models");
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

  const post = await Post.findById(postId).populate("author");
  if (!post) {
    throw new UserInputError("Post not found");
  }

  const replyToId = replyTo ? new mongoose.Types.ObjectId(replyTo) : null;

  const newComment = await Comment.create({
    text: text.trim(),
    author: user._id,
    targetType: "POST",
    targetId: post._id,
    replyTo: replyToId,
  });

  if (replyToId) {
    const parent = await Comment.findById(replyToId);
    if (parent) {
      parent.replies.push(newComment._id);
      await parent.save();
    }
  }

  post.comments.push(newComment._id);
  post.commentsCount = (post.commentsCount || 0) + 1;
  await post.save();

  await newComment.populate(buildRepliesPopulate(0));

  const notifications = [];
  const actorName = user.username || "Someone";
  const trimmedBody = text.trim();

  if (
    post.author &&
    post.author.token &&
    post.author.notificationsEnabled !== false &&
    String(post.author._id) !== String(user._id)
  ) {
    const title = `${actorName} commented on your post`;
    notifications.push({
      pushToken: post.author.token,
      title,
      body: trimmedBody,
      data: {
        type: "post_comment",
        postId: String(post._id),
        commentId: String(newComment._id),
      },
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
      notifications.push({
        pushToken: parent.author.token,
        title,
        body: trimmedBody,
        data: {
          type: "comment_reply",
          postId: String(post._id),
          commentId: String(newComment._id),
          parentCommentId: String(parent._id),
        },
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
