const { AuthenticationError } = require("apollo-server-express");
const { User, Post, Quote } = require("../../models");
const { sendPushNotifications } = require("../../utils/pushNotifications");
const {
  NotificationTypes,
  NotificationIntents,
  createNotificationForUser,
} = require("../../utils/notifications");

const ADMIN_USERNAME = "CandyMan🍭";

const requireAdmin = async (token) => {
  if (!token) {
    throw new AuthenticationError("Token is required");
  }

  const user = await User.findOne({ token });
  if (!user || user.username !== ADMIN_USERNAME) {
    throw new AuthenticationError("Unauthorized");
  }

  return user;
};

const moderatePostResolver = async (_, { token, postId, approve }) => {
  await requireAdmin(token);
  if (!postId) {
    throw new Error("postId is required");
  }

  const post = await Post.findById(postId)
    .populate("author")
    .populate({ path: "video", select: "url flagged viewsCount thumbnailUrl" });

  if (!post) {
    throw new Error("Post not found");
  }

  if (approve) {
    post.adminApproved = true;
    post.review = false;
    post.flagged = false;
  } else {
    post.flagged = true;
    post.adminApproved = false;
    post.review = false;
  }

  await post.save();

  if (!approve && post.author) {
    await createNotificationForUser({
      userId: post.author._id,
      notificationId: `flagged-${post._id.toString()}`,
      type: NotificationTypes.FLAGGED_POST,
      title: "A post needs your attention",
      description:
        "Your post was flagged by our team. Inappropriate content can lead to a ban.",
      intent: NotificationIntents.OPEN_POST_COMMENTS,
      postId: String(post._id),
      createdAt: post.updatedAt || post.createdAt,
    });
  }
  return post;
};

const moderateQuoteResolver = async (_, { token, quoteId, approve }) => {
  await requireAdmin(token);
  if (!quoteId) {
    throw new Error("quoteId is required");
  }

  const quote = await Quote.findById(quoteId).populate("user");

  if (!quote) {
    throw new Error("Quote not found");
  }

  if (approve) {
    quote.isApproved = true;
    quote.isDenied = false;
  } else {
    quote.isApproved = false;
    quote.isDenied = true;
  }

  await quote.save();
  if (approve && quote.user?.token && quote.user?.notificationsEnabled !== false) {
    try {
      await sendPushNotifications([
        {
          pushToken: quote.user.token,
          title: "Quote approved!",
          body: "Your quote will be shared in the daily motivation.",
          data: {
            type: "quote_approved",
            quoteId: String(quote._id),
          },
        },
      ]);
    } catch (notifyErr) {
      console.warn(
        "Quote approval notification error",
        notifyErr?.message || notifyErr
      );
    }
  }
  return quote;
};

module.exports = { moderatePostResolver, moderateQuoteResolver };
