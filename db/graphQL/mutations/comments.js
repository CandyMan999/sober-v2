const mongoose = require("mongoose");
const { AuthenticationError, UserInputError } = require("apollo-server-express");
const { Comment, Post, User } = require("../../models");

const creatingPostCommentResolver = async (_, args) => {
  const { token, postId, text, replyTo = null } = args;

  if (!text || !text.trim()) {
    throw new UserInputError("Comment text is required");
  }

  const user = await User.findOne({ token });
  if (!user) {
    throw new AuthenticationError("Invalid token");
  }

  const post = await Post.findById(postId);
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

  await newComment.populate(["author", "replyTo"]);
  return newComment;
};

module.exports = {
  creatingPostCommentResolver,
};
