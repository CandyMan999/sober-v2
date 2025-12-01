const { AuthenticationError, UserInputError } = require("apollo-server-express");
const { Like, Post, Quote, Comment, Room, User } = require("../../models");
const { publishDirectMessage } = require("../subscription/subscription");

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

  return payload;
};

module.exports = {
  toggleLikeResolver,
};
