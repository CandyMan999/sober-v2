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

/**
 * Compute a popularity score based on engagement metrics.
 * Values should be positive numbers; undefined or null values will be treated as zero.
 *
 * @param {Object} metrics
 * @param {number} metrics.watchMinutes - Total minutes of the user's videos watched.
 * @param {number} metrics.posts - Number of posts created by the user.
 * @param {number} metrics.comments - Number of comments authored by the user.
 * @param {number} metrics.likes - Total likes received across posts and comments.
 * @param {number} metrics.followers - Number of users following this user.
 * @param {number} metrics.approvedQuotes - Count of approved quotes attributed to the user.
 * @param {Object} [customWeighting] - Optional override for weights and milestones.
 * @returns {{score: number, status: string, breakdown: Record<string, number>}}
 */
export const calculatePopularity = (metrics = {}, customWeighting = DEFAULT_WEIGHTING) => {
  const breakdown = Object.entries(customWeighting).reduce((acc, [key, { weight, milestone }]) => {
    const rawValue = Number(metrics[key]) || 0;
    const contribution = clamp01(weight * normalizeMetric(rawValue, milestone) * 100);
    return { ...acc, [key]: Number(contribution.toFixed(2)) };
  }, {});

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

export const popularityStatusFromScore = (score) => getStatusLabel(Number(score) || 0);

export const defaultPopularityWeighting = DEFAULT_WEIGHTING;
