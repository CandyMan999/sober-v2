const serializePicture = (picture) => {
  if (!picture) return null;

  const plain = picture.toObject ? picture.toObject() : picture;
  const pictureId = plain.id || plain._id?.toString();

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
        const id = value?.id || value?._id?.toString?.() || value?.toString?.();

        if (!id) return null;

        if (typeof value === "object" && value !== null) {
          return { ...value, id };
        }

        return { id };
      })
      .filter(Boolean);

  return {
    ...plain,
    id: plain.id || plain._id?.toString(),
    profilePic: serializePicture(plain.profilePic),
    drunkPic: serializePicture(plain.drunkPic),
    savedPosts: mapIds(plain.savedPosts),
    savedQuotes: mapIds(plain.savedQuotes),
  };
};

module.exports = { serializePicture, serializeUser };
