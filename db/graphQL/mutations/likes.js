const { AuthenticationError, UserInputError } = require("apollo-server-express");
const { Like, Post, Quote, Comment, Room, User } = require("../../models");
const {
  publishDirectMessage,
  publishRoomComment,
  normalizeCommentForGraphQL,
} = require("../subscription/subscription");
const {
  NotificationTypes,
  NotificationIntents,
  createNotificationForUser,
} = require("../../utils/notifications");

const TARGET_MODELS = {
  POST: Post,
  QUOTE: Quote,
  COMMENT: Comment,
};

const publishDirectMessageLikeUpdate = async (targetType, targetId) => {
  if (targetType !== "COMMENT") return;

  const comment = await Comment.findById(targetId);
  if (!comment || comment.targetType !== "ROOM") return;

  const room = await Room.findById(comment.targetId);
  if (!room?.isDirect) return;

  const hydratedComment = await Comment.findById(targetId)
    .populate({ path: "author", populate: "profilePic" })
    .exec();

  publishDirectMessage(hydratedComment);
};

const publishRoomCommentLikeUpdate = async (commentId) => {
  if (!commentId) return;

  const [comment, likes] = await Promise.all([
    Comment.findById(commentId)
      .populate({ path: "author", populate: "profilePic" })
      .populate({
        path: "replyTo",
        populate: { path: "author", populate: "profilePic" },
      })
      .lean(),
    Like.find({ targetType: "COMMENT", targetId: commentId })
      .populate({ path: "user", select: "username profilePicUrl" })
      .lean(),
  ]);

  if (!comment) return;

  const hydrated = {
    ...comment,
    id: comment.id || comment._id?.toString?.(),
    likes,
    likesCount: comment.likesCount || likes?.length || 0,
  };

  publishRoomComment(normalizeCommentForGraphQL(hydrated));
};

const findTarget = async (targetType, targetId) => {
  const Model = TARGET_MODELS[targetType];

  if (!Model) {
    throw new UserInputError("Unsupported target type");
  }

  const target = await Model.findById(targetId);

  if (!target) {
    throw new UserInputError("Target not found");
  }

  return target;
};

const updateLikesCount = async (target, targetType, delta) => {
  if (targetType === "POST" || targetType === "QUOTE" || targetType === "COMMENT") {
    target.likesCount = Math.max(0, (target.likesCount || 0) + delta);
    await target.save();
  }
};

const toggleLikeResolver = async (_, { token, targetType, targetId }) => {
  const user = await User.findOne({ token });

  if (!user) {
    throw new AuthenticationError("Invalid token");
  }

  const target = await findTarget(targetType, targetId);

  const existingLike = await Like.findOne({
    user: user._id,
    targetType,
    targetId,
  });

  if (existingLike) {
    await existingLike.deleteOne();
    await updateLikesCount(target, targetType, -1);

    await publishDirectMessageLikeUpdate(targetType, targetId);

    if (targetType === "COMMENT") {
      await publishRoomCommentLikeUpdate(targetId);
    }

    return {
      liked: false,
      likesCount: target.likesCount || 0,
      targetType,
      targetId,
      like: null,
    };
  }

  const newLike = await Like.create({
    user: user._id,
    targetType,
    targetId,
  });

  await newLike.populate("user");
  await updateLikesCount(target, targetType, 1);

  const payload = {
    liked: true,
    likesCount: target.likesCount || 0,
    targetType,
    targetId,
    like: newLike,
  };

  await publishDirectMessageLikeUpdate(targetType, targetId);

  if (targetType === "COMMENT") {
    await publishRoomCommentLikeUpdate(targetId);
  }

  if (targetType === "COMMENT") {
    const comment = await Comment.findById(targetId).populate("author");

    if (comment?.author && String(comment.author._id) !== String(user._id)) {
      await createNotificationForUser({
        userId: comment.author._id,
        notificationId: `comment-like-${newLike._id.toString()}`,
        type: NotificationTypes.COMMENT_LIKED,
        title: `${user.username || "Someone"} liked your comment`,
        description: comment.text,
        intent: NotificationIntents.ACKNOWLEDGE,
        postId: String(comment.targetId),
        commentId: String(comment._id),
        createdAt: newLike.createdAt,
      });
    }
  }

  return payload;
};

module.exports = {
  toggleLikeResolver,
};
