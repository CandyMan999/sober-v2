const { SOCIAL_RULES } = require("./socialRules");

const normalizeHandle = (platform, rawValue) => {
  if (typeof rawValue !== "string") return null;

  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  const config = SOCIAL_RULES[platform];
  const urlPatterns = config?.urlPatterns ?? [];

  let handle = trimmed.replace(/@/g, "");

  urlPatterns.forEach((pattern) => {
    handle = handle.replace(pattern, "");
  });

  handle = handle.split(/[/?#]/)[0];

  return handle;
};

const isHandleFormatValid = (platform, handle) => {
  const config = SOCIAL_RULES[platform];
  if (!config?.pattern) return false;

  return config.pattern.test(handle);
};

const buildDeepLink = (platform, handle) => {
  const config = SOCIAL_RULES[platform];
  if (!config?.deepLink) return null;
  return config.deepLink(handle);
};

module.exports = { normalizeHandle, isHandleFormatValid, buildDeepLink };
