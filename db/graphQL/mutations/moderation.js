const { AuthenticationError } = require("apollo-server-express");
const { User, Post, Quote } = require("../../models");
const { sendPushNotifications } = require("../../utils/pushNotifications");

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
