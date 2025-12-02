const serializePicture = (picture) => {
  if (!picture) return null;

  const plain = picture.toObject ? picture.toObject() : picture;
  const pictureId =
    plain.id ||
    plain._id?.toString?.() ||
    plain.publicId ||
    (typeof plain.url === "string" ? plain.url : null);

  if (!pictureId && !plain.url) return null;

  return {
    ...plain,
    id: pictureId || plain.url,
  };
};

const serializeUser = (user) => {
  if (!user) return null;

  const plain = user.toObject ? user.toObject() : user;

  return {
    ...plain,
    id: plain.id || plain._id?.toString(),
    profilePic: serializePicture(plain.profilePic),
    drunkPic: serializePicture(plain.drunkPic),
  };
};

module.exports = { serializePicture, serializeUser };
