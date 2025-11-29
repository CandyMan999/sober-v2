const SOCIAL_RULES = {
  instagram: {
    label: "Instagram",
    pattern: /^[A-Za-z0-9._]{1,30}$/,
    error: "Please enter a valid Instagram username.",
    urlPatterns: [
      /^https?:\/\/(www\.)?instagram\.com\//i,
      /^instagram:\/\/user\?username=/i,
      /^@/,
    ],
    deepLink: (handle) => ({
      app: `instagram://user?username=${handle}`,
      web: `https://instagram.com/${handle}`,
    }),
    existsUrl: (handle) => `https://www.instagram.com/${handle}/`,
  },
  tiktok: {
    label: "TikTok",
    pattern: /^[A-Za-z0-9._]{1,24}$/,
    error: "Please enter a valid TikTok username.",
    urlPatterns: [
      /^https?:\/\/(www\.)?tiktok\.com\/[@]?/i,
      /^tiktok:\/\/user\?username=/i,
      /^@/,
    ],
    deepLink: (handle) => ({
      app: `snssdk1128://user/profile/${handle}`,
      web: `https://www.tiktok.com/@${handle}`,
    }),
    existsUrl: (handle) => `https://www.tiktok.com/@${handle}`,
  },
  x: {
    label: "X",
    pattern: /^[A-Za-z0-9_]{1,15}$/,
    error: "Please enter a valid X username.",
    urlPatterns: [
      /^https?:\/\/(www\.)?(x|twitter)\.com\//i,
      /^twitter:\/\//i,
      /^x:\/\/profile\//i,
      /^@/,
    ],
    deepLink: (handle) => ({
      app: `twitter://user?screen_name=${handle}`,
      web: `https://x.com/${handle}`,
    }),
    existsUrl: (handle) => `https://x.com/${handle}`,
  },
};

module.exports = { SOCIAL_RULES };
