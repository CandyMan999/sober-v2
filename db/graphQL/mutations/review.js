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

  if (!review) {
    // We only allow moving a post into review, not taking it back out.
    throw new Error("Posts can only be marked for review, not unmarked.");
  }

  post.review = true;
  const saved = await post.save();

  return saved;
};

module.exports = { setPostReviewResolver };
