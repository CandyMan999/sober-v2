const { AuthenticationError } = require("apollo-server-express");
const { Post, Quote, User, Video } = require("../../models");

const recordPostViewResolver = async (root, args) => {
  const { postId, token } = args;

  if (!postId) {
    throw new Error("postId is required");
  }

  if (!token) {
    throw new AuthenticationError("A valid token is required");
  }

  const viewer = await User.findOne({ token });
  if (!viewer) {
    throw new AuthenticationError("Invalid token");
  }

  const post = await Post.findById(postId).populate("video");

  if (!post) {
    throw new Error("Post not found");
  }

  // Record the view on the video (if present)
  if (post.mediaType === "VIDEO" && post.video?._id) {
    await Video.updateOne(
      { _id: post.video._id, viewers: { $ne: viewer._id } },
      { $addToSet: { viewers: viewer._id }, $inc: { viewsCount: 1 } }
    );

    const updatedVideo = await Video.findById(post.video._id);
    post.video = updatedVideo;
  }

  // Always record the view on the post itself (covers non-video posts)
  await Post.updateOne(
    { _id: postId, viewers: { $ne: viewer._id } },
    { $addToSet: { viewers: viewer._id }, $inc: { viewsCount: 1 } }
  );

  const updatedPost = await Post.findById(postId).populate("video");

  return updatedPost;
};

const recordQuoteViewResolver = async (root, args) => {
  const { quoteId, token } = args;

  if (!quoteId) {
    throw new Error("quoteId is required");
  }

  if (!token) {
    throw new AuthenticationError("A valid token is required");
  }

  const viewer = await User.findOne({ token });
  if (!viewer) {
    throw new AuthenticationError("Invalid token");
  }

  const quote = await Quote.findById(quoteId);

  if (!quote) {
    throw new Error("Quote not found");
  }

  await Quote.updateOne(
    { _id: quoteId, viewers: { $ne: viewer._id } },
    { $addToSet: { viewers: viewer._id }, $inc: { viewsCount: 1 } }
  );

  const updatedQuote = await Quote.findById(quoteId);

  return updatedQuote;
};

module.exports = { recordPostViewResolver, recordQuoteViewResolver };
