const { AuthenticationError, UserInputError } = require("apollo-server-express");
const { Post, Quote, User } = require("../../models");

const TARGET_CONFIG = {
  POST: {
    model: Post,
    field: "savedPosts",
  },
  QUOTE: {
    model: Quote,
    field: "savedQuotes",
  },
};

const normalizeId = (value) => value?.toString?.() || String(value || "");

const toggleSaveResolver = async (_, { token, targetType, targetId }) => {
  const user = await User.findOne({ token });

  if (!user) {
    throw new AuthenticationError("Invalid token");
  }

  const config = TARGET_CONFIG[targetType];

  if (!config) {
    throw new UserInputError("Unsupported target type");
  }

  const exists = await config.model.exists({ _id: targetId });

  if (!exists) {
    throw new UserInputError("Target not found");
  }

  const field = config.field;
  const existing = (user[field] || []).map(normalizeId);
  const targetKey = normalizeId(targetId);
  const alreadySaved = existing.includes(targetKey);

  const nextSaved = alreadySaved
    ? existing.filter((id) => id !== targetKey)
    : [targetKey, ...existing];

  user[field] = nextSaved;
  await user.save();

  return {
    saved: !alreadySaved,
    targetType,
    targetId,
  };
};

module.exports = { toggleSaveResolver };
