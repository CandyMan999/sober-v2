const { AuthenticationError, UserInputError } = require("apollo-server-express");

const { User } = require("../../models");
const { SOCIAL_RULES } = require("../../utils/socialRules");
const {
  normalizeHandle,
  isHandleFormatValid,
  buildDeepLink,
} = require("../../utils/handleValidators");
const { checkHandleExists } = require("../../utils/checkHandleExists");

const validatePlatform = (platform) => {
  if (!platform || typeof platform !== "string") {
    throw new UserInputError("Platform and handle required.");
  }

  const normalizedPlatform = platform.toLowerCase();
  if (!SOCIAL_RULES[normalizedPlatform]) {
    throw new UserInputError("Unsupported platform.");
  }

  return normalizedPlatform;
};

const buildSocialEntry = async (platform, handle) => {
  const normalizedHandle = normalizeHandle(platform, handle);

  if (!normalizedHandle) return null;

  if (!isHandleFormatValid(platform, normalizedHandle)) {
    throw new UserInputError(`Invalid ${platform} handle format.`);
  }

  const exists = await checkHandleExists(platform, normalizedHandle);
  if (!exists) {
    throw new UserInputError(`${platform} handle does not exist.`);
  }

  const deeplink = buildDeepLink(platform, normalizedHandle);
  if (!deeplink?.app && !deeplink?.web) {
    throw new UserInputError(`Unable to build a ${platform} profile link.`);
  }

  const webLink = deeplink?.web || null;
  const appLink = deeplink?.app || webLink;
  return {
    handle: normalizedHandle,
    deeplink: { app: appLink, web: webLink },
    website: webLink,
    verified: true,
  };
};

module.exports = {
  updateSocialResolver: async (_, { token, platform, handle }) => {
    const normalizedPlatform = validatePlatform(platform);

    const user = await User.findOne({ token });
    if (!user) throw new AuthenticationError("Invalid or expired session.");

    if (!handle || !String(handle).trim()) {
      const existingSocial =
        typeof user.social?.toObject === "function"
          ? user.social.toObject()
          : user.social || {};

      user.social = { ...existingSocial, [normalizedPlatform]: null };
      await user.save();
      return user;
    }

    const socialEntry = await buildSocialEntry(normalizedPlatform, handle);

    const existingSocial =
      typeof user.social?.toObject === "function"
        ? user.social.toObject()
        : user.social || {};

    user.social = { ...existingSocial, [normalizedPlatform]: socialEntry };
    await user.save();
    return user;
  },
};
