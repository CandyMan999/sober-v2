const { AuthenticationError } = require("apollo-server");
const axios = require("axios");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { pipeline } = require("stream/promises");
const FormData = require("form-data");
const { User, Post, Connection } = require("../../models");
const {
  sendPushNotifications,
  shouldSendPush,
  NotificationCategories,
} = require("../../utils/pushNotifications");
const { findClosestCity } = require("../../utils/location");
const { calculateDaysSober } = require("../../utils/sobriety");

require("dotenv").config();

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

const uploadStreamToTempFile = async (uploadPromise) => {
  const { createReadStream, filename, mimetype } = await uploadPromise;
  const stream = createReadStream();

  if (!stream) {
    throw new Error("Invalid upload stream received");
  }

  const tempPath = path.join(
    os.tmpdir(),
    `${Date.now()}-${filename || "image-upload"}`
  );

  await pipeline(stream, fs.createWriteStream(tempPath));

  return {
    tempPath,
    filename: filename || "image-upload",
    mimetype: mimetype || "application/octet-stream",
  };
};

const uploadImageToCloudflare = async ({ tempPath, filename, mimetype }) => {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    throw new Error(
      "Missing Cloudflare credentials (CF_ACCOUNT_ID / CF_API_TOKEN)"
    );
  }

  const form = new FormData();
  form.append("file", fs.createReadStream(tempPath), {
    filename,
    contentType: mimetype,
  });

  const response = await axios.post(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`,
    form,
    {
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        ...form.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000,
      validateStatus: () => true,
    }
  );

  const data = response?.data;

  if (!data?.success || !data?.result?.id) {
    const cfErrors =
      data?.errors && Array.isArray(data.errors)
        ? data.errors.map((e) => e?.message || JSON.stringify(e)).join("; ")
        : null;
    const status = response?.status || "unknown";

    throw new Error(
      cfErrors ||
        `Cloudflare Images upload failed (status ${status}). Please try again.`
    );
  }

  const imageResult = data.result;
  const variantUrl =
    Array.isArray(imageResult.variants) && imageResult.variants.length > 0
      ? imageResult.variants[0]
      : null;

  return { id: imageResult.id, url: variantUrl };
};

module.exports = {
  sendImagePostResolver: async (root, args) => {
    const { file, senderID, text } = args;

    try {
      if (!file) {
        throw new Error("Image file is required");
      }
      if (!senderID) {
        throw new Error("senderID is required");
      }

      const sender = await User.findById(senderID);
      if (!sender) {
        throw new Error("Sender not found");
      }

      const uploadInfo = await uploadStreamToTempFile(file);
      let imageMeta = null;

      try {
        imageMeta = await uploadImageToCloudflare(uploadInfo);
      } finally {
        if (uploadInfo?.tempPath) {
          fs.promises.unlink(uploadInfo.tempPath).catch(() => {});
        }
      }

      if (!imageMeta || !imageMeta.url) {
        throw new Error("Cloudflare did not return an image URL");
      }

      const postLocation = {
        lat: sender.lat ?? null,
        long: sender.long ?? null,
        closestCity: null,
      };

      const geoLocation =
        postLocation.lat !== null && postLocation.long !== null
          ? {
              type: "Point",
              coordinates: [postLocation.long, postLocation.lat],
            }
          : null;

      if (postLocation.lat !== null && postLocation.long !== null) {
        const nearestCity = await findClosestCity(postLocation.lat, postLocation.long);
        if (nearestCity?._id) {
          postLocation.closestCity = nearestCity._id;
        }
      }

      const daysSoberAtPost = calculateDaysSober(
        sender.sobrietyStartAt,
        new Date(),
        sender.timezone || "UTC"
      );

      const newPost = await Post.create({
        author: senderID,
        text: text || null,
        mediaType: "IMAGE",
        imageUrl: imageMeta.url,
        imagePublicId: imageMeta.id,
        flagged: false,
        likesCount: 0,
        commentsCount: 0,
        daysSober: daysSoberAtPost,
        ...postLocation,
        ...(geoLocation ? { location: geoLocation } : {}),
      });

      const populatedPost = await Post.findById(newPost._id)
        .populate("author")
        .populate("closestCity")
        .populate({
          path: "comments",
          populate: { path: "author" },
        })
        .exec();

      const followerConnections = await Connection.find({
        followee: senderID,
      }).populate("follower");

      const notifications = [];
      const senderName = sender.username || "Someone";
      const trimmedBody = (text || "").trim();
      const preview = trimmedBody
        ? trimmedBody.length > 140
          ? `${trimmedBody.slice(0, 137)}...`
          : trimmedBody
        : "Shared a new post";

      for (const connection of followerConnections) {
        const follower = connection?.follower;
        if (
          !follower?.token ||
          !shouldSendPush(follower, NotificationCategories.FOLLOWING_POSTS)
        ) {
          continue;
        }

        const notificationData = {
          type: "new_post",
          postId: String(newPost._id),
          senderId: String(sender._id),
          senderUsername: senderName,
        };

        notifications.push({
          pushToken: follower.token,
          title: `${senderName} shared a new post`,
          body: preview,
          data: notificationData,
        });
      }

      if (notifications.length) {
        await sendPushNotifications(notifications);
      }

      return populatedPost;
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      throw new AuthenticationError(msg);
    }
  },
};
