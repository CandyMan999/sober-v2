const mongoose = require("mongoose");
const {
  AuthenticationError,
  UserInputError,
} = require("apollo-server-express");
const { Comment, Post, Quote, User } = require("../../models");
const {
  NotificationTypes,
  NotificationIntents,
  createNotificationForUser,
} = require("../../utils/notifications");
const {
  sendPushNotifications,
  shouldSendPush,
  NotificationCategories,
} = require("../../utils/pushNotifications");

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

const createCommentForTarget = async ({
  token,
  targetId,
  targetType,
  text,
  replyTo = null,
}) => {
  if (!text || !text.trim()) {
    throw new UserInputError("Comment text is required");
  }

  const user = await User.findOne({ token });
  if (!user) {
    throw new AuthenticationError("Invalid token");
  }

  const models = {
    POST: { Model: Post, ownerPath: "author" },
    QUOTE: { Model: Quote, ownerPath: "user" },
  };

  const targetConfig = models[targetType];

  if (!targetConfig) {
    throw new UserInputError("Invalid target type for comment");
  }

  const target = await targetConfig.Model.findById(targetId).populate(
    targetConfig.ownerPath
  );

  if (!target) {
    throw new UserInputError(
      targetType === "POST" ? "Post not found" : "Quote not found"
    );
  }

  const replyToId = replyTo ? new mongoose.Types.ObjectId(replyTo) : null;
  const isReply = Boolean(replyToId);

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

  target.comments.push(newComment._id);
  target.commentsCount = (target.commentsCount || 0) + 1;
  await target.save();

  await newComment.populate(buildRepliesPopulate(0));

  const notifications = [];
  const actorName = user.username || "Someone";
  const trimmedBody = text.trim();
  const targetOwner = target[targetConfig.ownerPath] || null;

  if (!isReply && targetOwner && String(targetOwner._id) !== String(user._id)) {
    const title = `${targetType === "QUOTE" ? "Quote" : "Post"} Comment`;

    const ownerNotificationData = {
      type: NotificationTypes.COMMENT_ON_POST,
      intent: NotificationIntents.OPEN_POST_COMMENTS,
      targetType,
      targetId: String(target._id),
      commentId: String(newComment._id),
    };

    if (targetType === "POST") {
      ownerNotificationData.postId = String(target._id);
    }
    if (targetType === "QUOTE") {
      ownerNotificationData.quoteId = String(target._id);
    }

    if (
      targetOwner.token &&
      shouldSendPush(targetOwner, NotificationCategories.OTHER_USER_COMMENTS)
    ) {
      notifications.push({
        pushToken: targetOwner.token,
        title,
        body: `${actorName} said ${trimmedBody}`,
        data: ownerNotificationData,
      });
    }

    await createNotificationForUser({
      userId: targetOwner._id,
      notificationId: `comment-${newComment._id.toString()}`,
      type: NotificationTypes.COMMENT_ON_POST,
      title: `${actorName} commented on your post`,
      description: trimmedBody,
      intent: NotificationIntents.OPEN_POST_COMMENTS,
      postId: String(target._id),
      commentId: String(newComment._id),
      createdAt: newComment.createdAt,
    });
  }

  if (isReply) {
    const parent = await Comment.findById(replyToId).populate("author");

    if (parent?.author && String(parent.author._id) !== String(user._id)) {
      const title = `${actorName} replied to your comment`;

      const replyNotificationData = {
        type: NotificationTypes.COMMENT_REPLY,
        intent: NotificationIntents.OPEN_POST_COMMENTS,
        targetType,
        targetId: String(target._id),
        commentId: String(newComment._id),
        parentCommentId: String(parent._id),
      };

      if (targetType === "POST") {
        replyNotificationData.postId = String(target._id);
      }
      if (targetType === "QUOTE") {
        replyNotificationData.quoteId = String(target._id);
      }

      if (
        parent.author.token &&
        shouldSendPush(parent.author, NotificationCategories.OTHER_USER_COMMENTS)
      ) {
        notifications.push({
          pushToken: parent.author.token,
          title,
          body: `${actorName} said ${trimmedBody}`,
          data: replyNotificationData,
        });
      }

      await createNotificationForUser({
        userId: parent.author._id,
        notificationId: `comment-reply-${newComment._id.toString()}`,
        type: NotificationTypes.COMMENT_REPLY,
        title: `${actorName} replied to your comment`,
        description: trimmedBody,
        intent: NotificationIntents.OPEN_POST_COMMENTS,
        postId: String(target._id),
        commentId: String(newComment._id),
        createdAt: newComment.createdAt,
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

const creatingPostCommentResolver = async (_, args) =>
  createCommentForTarget({
    token: args.token,
    targetId: args.postId,
    targetType: "POST",
    text: args.text,
    replyTo: args.replyTo,
  });

const createQuoteCommentResolver = async (_, args) =>
  createCommentForTarget({
    token: args.token,
    targetId: args.quoteId,
    targetType: "QUOTE",
    text: args.text,
    replyTo: args.replyTo,
  });

module.exports = {
  creatingPostCommentResolver,
  createQuoteCommentResolver,
};
