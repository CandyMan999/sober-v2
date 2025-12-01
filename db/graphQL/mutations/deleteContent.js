const { AuthenticationError } = require("apollo-server");
const axios = require("axios");

const { Comment, Like, Post, Quote, User, Video } = require("../../models");

require("dotenv").config();

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_STREAM_TOKEN = process.env.CF_STREAM_TOKEN;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

const deleteCloudflareStream = async (publicId) => {
  if (!publicId) return;

  if (!CF_ACCOUNT_ID || !CF_STREAM_TOKEN) {
    console.warn("Missing Cloudflare Stream credentials; skipping stream delete");
    return;
  }

  try {
    await axios.delete(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/${publicId}`,
      { headers: { Authorization: `Bearer ${CF_STREAM_TOKEN}` } }
    );
  } catch (err) {
    console.warn(
      "Failed to delete Cloudflare stream asset:",
      err?.response?.data || err.message
    );
  }
};

const deleteCloudflareImage = async (publicId) => {
  if (!publicId) return;

  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    console.warn("Missing Cloudflare Images credentials; skipping image delete");
    return;
  }

  try {
    await axios.delete(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1/${publicId}`,
      { headers: { Authorization: `Bearer ${CF_API_TOKEN}` } }
    );
  } catch (err) {
    console.warn(
      "Failed to delete Cloudflare image:",
      err?.response?.data || err.message
    );
  }
};

const deleteCommentsAndLikes = async (targetType, targetId) => {
  const comments = await Comment.find({ targetType, targetId }).select("_id");
  const commentIds = comments.map((comment) => comment._id);

  if (commentIds.length > 0) {
    await Like.deleteMany({ targetType: "COMMENT", targetId: { $in: commentIds } });
    await Comment.deleteMany({ _id: { $in: commentIds } });
  }

  await Like.deleteMany({ targetType, targetId });
};

module.exports = {
  deletePostResolver: async (_, { token, postId }) => {
    const user = await User.findOne({ token });
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const post = await Post.findById(postId).populate("video");
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.author.toString() !== user._id.toString()) {
      throw new AuthenticationError("Not authorized to delete this post");
    }

    await deleteCommentsAndLikes("POST", post._id);

    if (post.video) {
      await deleteCloudflareStream(post.video.publicId);
      await Video.deleteOne({ _id: post.video._id });
    }

    if (post.imagePublicId) {
      await deleteCloudflareImage(post.imagePublicId);
    }

    await Post.deleteOne({ _id: postId });

    return true;
  },

  deleteQuoteResolver: async (_, { token, quoteId }) => {
    const user = await User.findOne({ token });
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const quote = await Quote.findById(quoteId);
    if (!quote) {
      throw new Error("Quote not found");
    }

    if (!quote.user || quote.user.toString() !== user._id.toString()) {
      throw new AuthenticationError("Not authorized to delete this quote");
    }

    await deleteCommentsAndLikes("QUOTE", quote._id);

    await Quote.deleteOne({ _id: quoteId });

    return true;
  },
};
