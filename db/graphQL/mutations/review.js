const { Post } = require("../../models");
const {
  NotificationTypes,
  NotificationIntents,
  createNotificationForUser,
} = require("../../utils/notifications");

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

  if (post?.author) {
    await createNotificationForUser({
      userId: post.author,
      notificationId: `flagged-${post._id.toString()}`,
      type: NotificationTypes.FLAGGED_POST,
      title: "A post needs your attention",
      description: "Your post was flagged by our team.",
      intent: NotificationIntents.OPEN_POST_COMMENTS,
      postId: String(post._id),
      createdAt: saved?.updatedAt || saved?.createdAt,
    });
  }

  return saved;
};

module.exports = { setPostReviewResolver };
