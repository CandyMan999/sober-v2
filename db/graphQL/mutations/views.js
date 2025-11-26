const { AuthenticationError } = require("apollo-server-express");
const { Post, User, Video } = require("../../models");

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

  if (post.mediaType !== "VIDEO" || !post.video) {
    return post;
  }

  const videoId = post.video._id;
  if (!videoId) {
    return post;
  }

  await Video.updateOne(
    { _id: videoId, viewers: { $ne: viewer._id } },
    { $addToSet: { viewers: viewer._id }, $inc: { viewsCount: 1 } }
  );

  const updatedVideo = await Video.findById(videoId);
  post.video = updatedVideo;

  return post;
};

module.exports = { recordPostViewResolver };
