const { Popularity, Post, Comment, Quote } = require("../models");

const DEFAULT_WEIGHTING = {
  watchMinutes: { weight: 0.25, milestone: 600 },
  posts: { weight: 0.2, milestone: 30 },
  comments: { weight: 0.15, milestone: 50 },
  likes: { weight: 0.2, milestone: 200 },
  followers: { weight: 0.15, milestone: 500 },
  approvedQuotes: { weight: 0.05, milestone: 20 },
};

const STATUS_THRESHOLDS = [
  { minScore: 80, label: "Icon" },
  { minScore: 60, label: "Community Star" },
  { minScore: 40, label: "On The Rise" },
  { minScore: 20, label: "Warming Up" },
  { minScore: 0, label: "Getting Started" },
];

const clamp01 = (value) => Math.max(0, Math.min(1, value));

const normalizeMetric = (value, milestone) => {
  if (milestone <= 0) return 0;
  return clamp01(value / milestone);
};

const getStatusLabel = (score) => {
  const threshold = STATUS_THRESHOLDS.find(({ minScore }) => score >= minScore);
  return threshold ? threshold.label : "Getting Started";
};

const calculatePopularity = (metrics = {}, customWeighting = DEFAULT_WEIGHTING) => {
  const breakdown = Object.entries(customWeighting).reduce(
    (acc, [key, { weight, milestone }]) => {
      const rawValue = Number(metrics[key]) || 0;
      const contribution = clamp01(weight * normalizeMetric(rawValue, milestone) * 100);
      return { ...acc, [key]: Number(contribution.toFixed(2)) };
    },
    {}
  );

  const score = Number(
    Object.values(breakdown)
      .reduce((total, value) => total + value, 0)
      .toFixed(2)
  );

  return {
    score,
    status: getStatusLabel(score),
    breakdown,
  };
};

const ensurePopularityRecord = async (userId) => {
  if (!userId) return null;

  return Popularity.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId } },
    { new: true, upsert: true }
  );
};

const addWatchTimeForUser = async (userId, watchSeconds = 0) => {
  const increment = Number.isFinite(Number(watchSeconds))
    ? Math.max(0, Number(watchSeconds))
    : 0;

  if (!userId || increment <= 0) return null;

  return Popularity.findOneAndUpdate(
    { user: userId },
    {
      $setOnInsert: { user: userId },
      $inc: { watchSeconds: increment },
    },
    { new: true, upsert: true }
  );
};

const sumField = async (Model, match, field) => {
  const [result] = await Model.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: { $ifNull: [`$${field}`, 0] } } } },
  ]);

  return result?.total || 0;
};

const buildPopularitySnapshot = async (user) => {
  const userId = user?._id || user;
  if (!userId) return null;

  const [
    popularityDoc,
    postsCount,
    commentsCount,
    approvedQuotes,
    postLikes,
    quoteLikes,
    commentLikes,
  ] = await Promise.all([
    ensurePopularityRecord(userId),
    Post.countDocuments({ author: userId }),
    Comment.countDocuments({ author: userId }),
    Quote.countDocuments({ user: userId, isApproved: true }),
    sumField(Post, { author: userId }, "likesCount"),
    sumField(Quote, { user: userId }, "likesCount"),
    sumField(Comment, { author: userId }, "likesCount"),
  ]);

  const watchSeconds = popularityDoc?.watchSeconds || 0;
  const watchMinutes = Number((watchSeconds / 60).toFixed(2));

  const breakdown = {
    watchMinutes,
    posts: postsCount,
    comments: commentsCount,
    likes: postLikes + quoteLikes + commentLikes,
    followers: user?.followersCount ?? 0,
    approvedQuotes,
  };

  const popularity = calculatePopularity(breakdown);

  return {
    ...popularity,
    breakdown,
  };
};

module.exports = {
  addWatchTimeForUser,
  buildPopularitySnapshot,
  calculatePopularity,
  DEFAULT_WEIGHTING,
};
