const { Post } = require("../../models");

const setPostReviewResolver = async (root, args) => {
  const { postId, review } = args;

  if (!postId) {
    throw new Error("postId is required");
  }

  const post = await Post.findById(postId);

  if (!post) {
    throw new Error("Post not found");
  }

  if (!post.mediaType) {
    post.mediaType = "VIDEO";
  }

  post.review = !!review;
  const saved = await post.save();

  return saved;
};

module.exports = { setPostReviewResolver };
