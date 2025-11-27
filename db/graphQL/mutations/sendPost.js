// graphQL/mutations/sendPost.js
const { AuthenticationError } = require("apollo-server");
const axios = require("axios");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { pipeline } = require("stream/promises");
const FormData = require("form-data");
const { User, Video, Post } = require("../../models");
const { findClosestCity } = require("../../utils/location");
// const {
//   sendPushNotification,
//   pushNotificationUserFlagged,
// } = require("../../utils/middleware");
// const { publishCreateVideo } = require("../subscription/subscription");

require("dotenv").config();

let processingQueue = [];
let isProcessing = false;

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_STREAM_TOKEN;

// Use your customer domain for downloads/HLS
const CF_STREAM_CUSTOMER_DOMAIN =
  process.env.CF_STREAM_CUSTOMER_DOMAIN ||
  "customer-gfa5yroqzvkyfego.cloudflarestream.com";

// Your nudity detector
const NUDE_DETECTOR_URL =
  "https://auto-detect-1fcde9e6d000.herokuapp.com/nudity/detect";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// -----------------------------
// Upload helpers (server → Cloudflare)
// -----------------------------
const uploadStreamToTempFile = async (uploadPromise) => {
  const { createReadStream, filename, mimetype } = await uploadPromise;
  const stream = createReadStream();

  if (!stream) {
    throw new Error("Invalid upload stream received");
  }

  const tempPath = path.join(
    os.tmpdir(),
    `${Date.now()}-${filename || "video-upload"}`
  );

  await pipeline(stream, fs.createWriteStream(tempPath));

  return {
    tempPath,
    filename: filename || "video-upload",
    mimetype: mimetype || "application/octet-stream",
  };
};

const uploadVideoToCloudflare = async ({ tempPath, filename, mimetype }) => {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    throw new Error(
      "Missing Cloudflare credentials (CF_ACCOUNT_ID / CF_STREAM_TOKEN or CF_API_TOKEN)"
    );
  }

  const form = new FormData();
  form.append("file", fs.createReadStream(tempPath), {
    filename,
    contentType: mimetype,
  });
  form.append("maxDurationSeconds", 121);

  const response = await axios.post(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream`,
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

  if (!data?.success || !data?.result?.uid) {
    const cfErrors =
      data?.errors && Array.isArray(data.errors)
        ? data.errors.map((e) => e?.message || JSON.stringify(e)).join("; ")
        : null;
    const status = response?.status || "unknown";

    throw new Error(
      cfErrors ||
        `Cloudflare Stream upload failed (status ${status}). Please try again.`
    );
  }

  return data.result;
};

const uploadVideoWithRetry = async (fileInfo) => {
  const maxAttempts = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[cf] upload attempt ${attempt}/${maxAttempts}`);
      return await uploadVideoToCloudflare(fileInfo);
    } catch (err) {
      lastError = err;
      console.error(
        `[cf] upload attempt ${attempt} failed:`,
        err?.message || err
      );

      if (attempt < maxAttempts) {
        await delay(1500 * attempt);
      }
    }
  }

  throw lastError || new Error("Upload failed after retries");
};

// -----------------------------
// Cloudflare helpers
// -----------------------------
const cfGetAsset = async (uid) => {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/${uid}`;
  const resp = await axios.get(url, {
    headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
    timeout: 15000,
  });

  return resp.data; // { success, result: { readyToStream, ... } }
};

const cfKickoffDownloads = async (uid) => {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/${uid}/downloads`;
  const resp = await axios.post(
    url,
    {},
    {
      headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
      timeout: 15000,
    }
  );

  return resp.data; // may be success:false if not ready yet
};

const cfGetDownloadsStatus = async (uid) => {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/${uid}/downloads`;
  const resp = await axios.get(url, {
    headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
    timeout: 15000,
  });

  return resp.data; // { success, result: { default: { status, percentComplete, url } } }
};

const waitUntilReadyToStream = async (uid) => {
  const MAX_ATTEMPTS = 9; // ~127s total backoff, not 63s
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const data = await cfGetAsset(uid);
      if (data && data.success && data.result && data.result.readyToStream) {
        return data.result;
      }
      const delayMs = Math.min(1000 * Math.pow(2, i), 5000); // cap per-try delay at 5s
      await new Promise((r) => setTimeout(r, delayMs));
    } catch (e) {
      const status = e && e.response && e.response.status;
      if (status !== 404 && status !== 403) throw e; // keep your real errors

      // NEW: brief backoff on 404/403 so we don't tight-loop
      const delayMs = Math.min(1000 * Math.pow(2, i), 5000);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error(`Stream asset ${uid} not ready in time`);
};

const headOk = async (url) => {
  try {
    const resp = await axios.head(url, { timeout: 15000 });
    console.log("[http] HEAD status:", resp.status);
    return resp && resp.status >= 200 && resp.status < 400;
  } catch (e) {
    const msg =
      e && e.response && e.response.status
        ? String(e.response.status)
        : e && e.message
        ? e.message
        : String(e);
    console.warn("[http] HEAD failed:", msg);
    return false;
  }
};

const toCfMp4 = (uid) => {
  // Store MP4 (customer domain)
  const url = `https://${CF_STREAM_CUSTOMER_DOMAIN}/${uid}/downloads/default.mp4`;
  console.log("[urls] mp4:", url);
  return url;
};

const toCfHls = (uid) => {
  const url = `https://${CF_STREAM_CUSTOMER_DOMAIN}/${uid}/manifest/video.m3u8`;
  console.log("[urls] hls:", url);
  return url;
};

/**
 * Kickoff and wait until MP4 download is actually available.
 * Returns the final MP4 URL.
 */
const waitUntilMp4Ready = async (uid) => {
  // 1) Ensure HLS ready
  await waitUntilReadyToStream(uid);

  // 2) Kickoff downloads (may already return success:true)
  try {
    await cfKickoffDownloads(uid);
  } catch (e) {
    console.warn(
      "[cf] kickoff error (continuing to poll downloads):",
      e && e.response && e.response.data
        ? JSON.stringify(e.response.data)
        : e && e.message
        ? e.message
        : String(e)
    );
  }

  // 3) Poll downloads endpoint + HEAD the MP4 until usable
  const mp4Url = toCfMp4(uid);
  const MAX_POLLS = 24; // up to ~120s (5s * 12)
  for (let i = 0; i < MAX_POLLS; i++) {
    try {
      const stat = await cfGetDownloadsStatus(uid);
      if (stat && stat.success && stat.result && stat.result.default) {
        const s = stat.result.default.status || "";
        const pct =
          typeof stat.result.default.percentComplete !== "undefined"
            ? stat.result.default.percentComplete
            : null;
        const u = stat.result.default.url || mp4Url;

        console.log(
          "[cf] downloads poll:",
          JSON.stringify({ status: s, percentComplete: pct, url: u })
        );

        // If CF reports it's ready (or 100%), we still validate with HEAD
        if (
          s.toLowerCase() === "ready" ||
          s.toLowerCase() === "completed" ||
          pct === 100 ||
          pct === "100.000000"
        ) {
          const ok = await headOk(u);
          if (ok) return u;
        }
      }
    } catch (e) {
      console.warn(
        "[cf] downloads poll error:",
        e && e.response && e.response.data
          ? JSON.stringify(e.response.data)
          : e && e.message
          ? e.message
          : String(e)
      );
    }

    // Fallback: try HEAD anyway (sometimes status lags but file is there)
    const ok = await headOk(mp4Url);
    if (ok) return mp4Url;

    await new Promise((r) => setTimeout(r, 5000)); // 5s cadence
  }

  // Final attempt—HEAD once more
  const finalOk = await headOk(mp4Url);
  if (finalOk) return mp4Url;

  throw new Error("MP4 not ready after polling");
};

// -----------------------------
// Queue + Nudity detection
// -----------------------------
const addToQueue = (videoId, uid) => {
  console.log("[queue] add:", { videoId: String(videoId), uid: String(uid) });
  processingQueue.push({ videoId, uid });
  if (!isProcessing) processQueue();
};

const processQueue = async () => {
  if (processingQueue.length === 0) {
    isProcessing = false;
    console.log("[queue] empty");
    return;
  }
  isProcessing = true;

  const item = processingQueue.shift();
  const videoId = item ? item.videoId : null;
  const uid = item ? item.uid : null;

  if (videoId && uid) {
    try {
      await customNudityAPI(videoId, uid);
    } catch (e) {
      const msg = e && e.message ? e.message : String(e);
      console.error("[nudity] fatal:", msg);
    }
  }

  processQueue();
};

const customNudityAPI = async (videoId, uid) => {
  try {
    const mp4Url = await waitUntilMp4Ready(uid);
    console.log("[nudity] mp4 ready:", mp4Url);

    // hit detector with MP$ url
    const resp = await axios.post(
      NUDE_DETECTOR_URL,
      { video_url: mp4Url },
      { timeout: 90000 }
    );

    console.log("[nudity] detector resp:", JSON.stringify(resp.data));
    const flagged = !!resp && resp.data && resp.data.nudity_detected;
    // if (flagged) {
    //   pushNotificationUserFlagged("ExponentPushToken[PtoiwgLjWKaXTzEaTY0jbT]");
    // }

    //TODO - populate associated post to be flagged if nudity was detected in video

    // MINIMAL change: replace url with MP4
    const updated = await Video.findByIdAndUpdate(
      videoId,
      { url: mp4Url, flagged }, // <— swap to MP4 in the SAME url field
      { new: true }
    ).populate("post");

    // ---- NEW: if video flagged, flag related post ----
    if (flagged && updated?.post?._id) {
      await Post.findByIdAndUpdate(updated.post._id, { flagged: true });
      console.log(`[nudity] Post ${updated.post._id} flagged due to video.`);
    }

    // // optional but recommended: tell clients the item changed
    // if (updated) {
    //   publishCreateVideo(updated); // reuse your existing publish function
    // }
  } catch (error) {
    const log =
      error && error.response && error.response.data
        ? error.response.data
        : error && error.message
        ? error.message
        : String(error);
    console.error("Error detecting nudity asynchronously:", log);
  }
};

// -----------------------------
// Resolvers
// -----------------------------
module.exports = {
  sendPostResolver: async (root, args) => {
    const { file, senderID, text } = args;

    try {
      if (!file) {
        throw new Error("Video file is required");
      }
      if (!senderID) {
        throw new Error("senderID is required");
      }

      const sender = await User.findById(senderID);
      if (!sender) {
        throw new Error("Sender not found");
      }

      const uploadInfo = await uploadStreamToTempFile(file);
      let publicId = null;
      let hlsUrl = null;

      try {
        const cfResult = await uploadVideoWithRetry(uploadInfo);
        publicId = cfResult?.uid || cfResult?.id;

        if (!publicId) {
          throw new Error("Cloudflare upload did not return a uid");
        }

        hlsUrl = cfResult?.playback?.hls || toCfHls(publicId);
      } finally {
        if (uploadInfo?.tempPath) {
          fs.promises.unlink(uploadInfo.tempPath).catch(() => {});
        }
      }

      const video = await Video.create({
        url: hlsUrl,
        publicId,
        sender: senderID,
      });

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

      const newPost = await Post.create({
        author: senderID,
        text: text || null,
        mediaType: "VIDEO",
        video: video._id,
        flagged: false,
        likesCount: 0,
        commentsCount: 0,
        ...postLocation,
        ...(geoLocation ? { location: geoLocation } : {}),
      });

      video.post = newPost._id;
      await video.save();

      addToQueue(video._id, publicId);

      const populatedPost = await Post.findById(newPost._id)
        .populate("author")
        .populate("video")
        .populate("closestCity")
        .exec();

      return populatedPost;
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      throw new AuthenticationError(msg);
    }
  },
};
