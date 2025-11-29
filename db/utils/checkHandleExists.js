const axios = require("axios");
const { normalizeHandle } = require("./handleValidators");

const PROFILE_URLS = {
  tiktok: (handle) => `https://www.tiktok.com/@${handle}`,
  instagram: (handle) => `https://www.instagram.com/${handle}/`,
  x: (handle) => `https://x.com/${handle}`,
};

const CHECK_TIMEOUT_MS = 3500;

const checkHandleExists = async (platform, rawHandle) => {
  const normalizedHandle = normalizeHandle(platform, rawHandle);
  if (!normalizedHandle) return false;

  const buildUrl = PROFILE_URLS[platform];
  if (!buildUrl) throw new Error(`Unsupported platform: ${platform}`);

  const url = buildUrl(normalizedHandle);

  try {
    const res = await axios.get(url, {
      maxRedirects: 3,
      timeout: CHECK_TIMEOUT_MS,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
      validateStatus: () => true,
    });

    if (res.status === 200) return true;
    if (res.status === 301 || res.status === 302) return true;
    if (res.status === 404) return false;

    return false;
  } catch (err) {
    console.error("checkHandleExists error:", err?.message || err);
    return false;
  }
};

module.exports = { checkHandleExists };
