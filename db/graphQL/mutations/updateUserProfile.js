const { AuthenticationError, UserInputError } = require("apollo-server-express");

const { User } = require("../../models");
const { SOCIAL_RULES } = require("../../utils/socialRules");
const {
  normalizeHandle,
  isHandleFormatValid,
  buildDeepLink,
} = require("../../utils/handleValidators");
const { checkHandleExists } = require("../../utils/checkHandleExists");
const { serializeUser } = require("../../utils/serializeUser");

const validateAndNormalizeSocials = async (social) => {
  const socialUpdates = {};

  // Sequentially validate each platform to surface a single actionable error at a time
  for (const platform of ["instagram", "tiktok", "x"]) {
    if (!Object.prototype.hasOwnProperty.call(social, platform)) continue;

    const rawValue = social[platform];
    if (rawValue === undefined) continue; // no update provided for this platform

    if (rawValue === null) {
      socialUpdates[platform] = null;
      continue;
    }

    const normalizedHandle = normalizeHandle(platform, rawValue);

    if (!normalizedHandle) {
      socialUpdates[platform] = null;
      continue;
    }

    if (!isHandleFormatValid(platform, normalizedHandle)) {
      throw new UserInputError(SOCIAL_RULES[platform]?.error || "Invalid handle format.");
    }

    const exists = await checkHandleExists(platform, normalizedHandle);
    if (!exists) {
      const label = SOCIAL_RULES[platform]?.label || platform;
      throw new UserInputError(`${label} handle does not appear to exist.`);
    }

    const deeplink = buildDeepLink(platform, normalizedHandle);

    socialUpdates[platform] = {
      handle: normalizedHandle,
      deeplink,
      website: deeplink?.web || null,
      verified: true,
    };
  }

  return socialUpdates;
};

module.exports = {
  updateUserProfileResolver: async (
    _,
    {
      token,
      username,
      profilePicUrl,
      sobrietyStartAt,
      timezone,
      lat,
      long,
      whyStatement,
      social,
    }
  ) => {
    try {
      let user = await User.findOne({ token });

      if (!user) {
        user = new User({ token });
      }

      if (typeof username === "string") {
        const trimmedUsername = username.trim();

        if (trimmedUsername) {
          const duplicateUser = await User.findOne({
            username: trimmedUsername,
            _id: { $ne: user._id },
          });

          if (duplicateUser) {
            throw new AuthenticationError("That username is already taken. Pick another.");
          }

          user.username = trimmedUsername;
        }
      }

      if (typeof profilePicUrl === "string") {
        user.profilePicUrl = profilePicUrl;
      }

      if (typeof sobrietyStartAt === "string") {
        // Expecting ISO string from the client
        user.sobrietyStartAt = new Date(sobrietyStartAt);
      }

      if (typeof timezone === "string") {
        user.timezone = timezone;
      }

      if (typeof lat === "number") {
        user.lat = lat;
      }

      if (typeof long === "number") {
        user.long = long;
      }

      if (typeof whyStatement === "string") {
        user.whyStatement = whyStatement.trim();
      }

      if (social && typeof social === "object") {
        const socialUpdates = await validateAndNormalizeSocials(social);

        if (Object.keys(socialUpdates).length) {
          const existingSocial =
            typeof user.social?.toObject === "function"
              ? user.social.toObject()
              : user.social || {};

          user.social = { ...existingSocial, ...socialUpdates };
        }
      }

      await user.save();
      await user.populate(["profilePic", "drunkPic"]);

      return serializeUser(user);
    } catch (err) {
      if (err instanceof AuthenticationError || err instanceof UserInputError) {
        throw err;
      }

      throw new AuthenticationError(err.message);
    }
  },
};
