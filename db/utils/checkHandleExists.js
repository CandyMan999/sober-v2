const axios = require("axios");
const { SOCIAL_RULES } = require("./socialRules");
const { normalizeHandle } = require("./handleValidators");

const CHECK_TIMEOUT_MS = 3500;

const checkHandleExists = async (platform, rawHandle) => {
  const normalizedHandle = normalizeHandle(platform, rawHandle);
  if (!normalizedHandle) return false;

  const existsUrl = SOCIAL_RULES[platform]?.existsUrl?.(normalizedHandle);
  if (!existsUrl) return true;

  try {
    const response = await axios.get(existsUrl, {
      timeout: CHECK_TIMEOUT_MS,
      maxRedirects: 3,
      validateStatus: () => true,
    });

    return response.status >= 200 && response.status < 400;
  } catch (err) {
    console.warn(`Handle existence check failed for ${platform}`, err?.message || err);
    return false;
  }
};

module.exports = { checkHandleExists };
