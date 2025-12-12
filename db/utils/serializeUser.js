const { normalizeNotificationSettings } = require("./notificationSettings");

const toIdString = (id) => {
  if (!id) return null;
  if (typeof id === "string") return id;
  if (typeof id?.toString === "function") return id.toString();
  return null;
};

const serializePicture = (picture) => {
  if (!picture) return null;

  const plain = picture.toObject ? picture.toObject() : picture;
  const pictureId = toIdString(plain.id) || toIdString(plain._id);

  if (!plain?.url) return null;

  if (!pictureId) return null;

  return {
    ...plain,
    id: pictureId,
  };
};

const serializeUser = (user) => {
  if (!user) return null;

  const plain = user.toObject ? user.toObject() : user;
  const mapIds = (items = []) =>
    (items || [])
      .map((entry) => {
        const value = entry?.toObject ? entry.toObject() : entry;
        const id =
          toIdString(value?.id) || toIdString(value?._id) || toIdString(value);

        if (!id) return null;

        if (typeof value === "object" && value !== null) {
          return { ...value, id };
        }

        return { id };
      })
      .filter(Boolean);

  const trialEndsAt = plain.trialEndsAt
    ? new Date(plain.trialEndsAt).toISOString()
    : null;
  const isTrialExpired = trialEndsAt
    ? new Date(trialEndsAt).getTime() <= Date.now()
    : false;

  return {
    ...plain,
    id: toIdString(plain.id) || toIdString(plain._id),
    appleId: plain.appleId || null,
    profilePic: serializePicture(plain.profilePic),
    drunkPic: serializePicture(plain.drunkPic),
    savedPosts: mapIds(plain.savedPosts),
    savedQuotes: mapIds(plain.savedQuotes),
    notificationSettings: normalizeNotificationSettings(plain),
    trialEndsAt,
    isTrialExpired,
  };
};

module.exports = { serializePicture, serializeUser };
