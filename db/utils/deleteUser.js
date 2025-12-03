const axios = require("axios");
const {
  User,
  Post,
  Like,
  Comment,
  Connection,
  Video,
  Picture,
  Quote,
  Room,
} = require("../models");

require("dotenv").config();

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_STREAM_TOKEN = process.env.CF_STREAM_TOKEN;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

const uniqueDocsById = (docs = []) =>
  Array.from(
    new Map(
      docs
        .map((doc) => {
          const id = doc?._id?.toString?.() || doc?.toString?.();
          return [id, doc];
        })
        .filter(([id]) => Boolean(id))
    ).values()
  );

const deleteCloudflareStream = async (publicId) => {
  if (!publicId) return;

  if (!CF_ACCOUNT_ID || !CF_STREAM_TOKEN) {
    console.warn("Missing Cloudflare Stream credentials; skipping stream delete");
    return;
  }

  try {
    await axios.delete(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/${publicId}`,
      { headers: { Authorization: `Bearer ${CF_STREAM_TOKEN}` } }
    );
  } catch (err) {
    console.warn(
      "Failed to delete Cloudflare stream asset:",
      err?.response?.data || err.message
    );
  }
};

const deleteCloudflareImage = async (publicId) => {
  if (!publicId) return;

  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    console.warn("Missing Cloudflare Images credentials; skipping image delete");
    return;
  }

  try {
    await axios.delete(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1/${publicId}`,
      { headers: { Authorization: `Bearer ${CF_API_TOKEN}` } }
    );
  } catch (err) {
    console.warn(
      "Failed to delete Cloudflare image:",
      err?.response?.data || err.message
    );
  }
};

const recalcQuoteEngagement = async (quoteId) => {
  const [likesCount, commentsCount] = await Promise.all([
    Like.countDocuments({ targetType: "QUOTE", targetId: quoteId }),
    Comment.countDocuments({ targetType: "QUOTE", targetId: quoteId }),
  ]);

  await Quote.findByIdAndUpdate(quoteId, { likesCount, commentsCount });

  return { likesCount, commentsCount };
};

const deleteUserAndRecalculate = async (userId) => {
  const user = await User.findById(userId).populate(["profilePic", "drunkPic"]);
  if (!user) return false;

  const [
    userPosts,
    userComments,
    userLikes,
    userConnections,
    userPictures,
    userQuotes,
    roomsWithUser,
  ] = await Promise.all([
    Post.find({ author: userId }).populate("video"),
    Comment.find({ author: userId }).select("_id targetType targetId"),
    Like.find({ user: userId }).select("_id targetType targetId"),
    Connection.find({ $or: [{ follower: userId }, { followee: userId }] }),
    Picture.find({ user: userId }),
    Quote.find({ user: userId }).select("_id isApproved"),
    Room.find({ users: userId }).select("_id isDirect comments lastMessage"),
  ]);

  const directRoomIds = roomsWithUser
    .filter((room) => room.isDirect)
    .map((room) => room._id);
  const groupRoomIds = roomsWithUser
    .filter((room) => !room.isDirect)
    .map((room) => room._id);

  const directRoomCommentDocs = directRoomIds.length
    ? await Comment.find({ targetType: "ROOM", targetId: { $in: directRoomIds } }).select(
        "_id"
      )
    : [];

  const postIds = userPosts.map((post) => post._id);
  const postIdStrings = postIds.map((id) => id.toString());
  const approvedQuoteIds = userQuotes
    .filter((quote) => quote.isApproved)
    .map((quote) => quote._id);
  const unapprovedQuoteIds = userQuotes
    .filter((quote) => !quote.isApproved)
    .map((quote) => quote._id);
  const unapprovedQuoteIdStrings = unapprovedQuoteIds.map((id) => id.toString());

  const userCommentIds = userComments.map((comment) => comment._id);
  const postComments = postIds.length
    ? await Comment.find({ targetType: "POST", targetId: { $in: postIds } }).select(
        "_id targetId"
      )
    : [];
  const quoteComments = unapprovedQuoteIds.length
    ? await Comment.find({
        targetType: "QUOTE",
        targetId: { $in: unapprovedQuoteIds },
      }).select("_id targetId")
    : [];

  const commentIdsToDelete = uniqueDocsById([
    ...userCommentIds,
    ...postComments.map((comment) => comment._id),
    ...quoteComments.map((comment) => comment._id),
    ...directRoomCommentDocs.map((comment) => comment._id),
  ]);

  if (commentIdsToDelete.length) {
    await Like.deleteMany({ targetType: "COMMENT", targetId: { $in: commentIdsToDelete } });
    await Comment.deleteMany({ _id: { $in: commentIdsToDelete } });
  }

  if (postIds.length) {
    await Like.deleteMany({ targetType: "POST", targetId: { $in: postIds } });

    for (const post of userPosts) {
      if (post.video) {
        await deleteCloudflareStream(post.video.publicId);
        await Video.deleteOne({ _id: post.video._id || post.video });
      }

      if (post.imagePublicId) {
        await deleteCloudflareImage(post.imagePublicId);
      }
    }

    await Post.deleteMany({ _id: { $in: postIds } });
  }

  if (unapprovedQuoteIds.length) {
    await Like.deleteMany({
      targetType: "QUOTE",
      targetId: { $in: unapprovedQuoteIds },
    });
    await Quote.deleteMany({ _id: { $in: unapprovedQuoteIds } });
  }

  if (approvedQuoteIds.length) {
    await Quote.updateMany({ _id: { $in: approvedQuoteIds } }, { $unset: { user: "" } });
  }

  if (userPictures.length || user.profilePic || user.drunkPic) {
    const picturesToDelete = uniqueDocsById([
      ...userPictures,
      ...(user.profilePic ? [user.profilePic] : []),
      ...(user.drunkPic ? [user.drunkPic] : []),
    ]);

    for (const picture of picturesToDelete) {
      if (picture?.publicId) {
        await deleteCloudflareImage(picture.publicId);
      }
    }

    await Picture.deleteMany({ _id: { $in: picturesToDelete.map((pic) => pic._id) } });
  }

  await Promise.all([
    Like.deleteMany({ user: userId }),
    Comment.deleteMany({ author: userId }),
    Connection.deleteMany({ $or: [{ follower: userId }, { followee: userId }] }),
  ]);

  if (directRoomIds.length) {
    await Room.deleteMany({ _id: { $in: directRoomIds } });
  }

  if (commentIdsToDelete.length) {
    await Room.updateMany(
      { comments: { $in: commentIdsToDelete } },
      { $pull: { comments: { $in: commentIdsToDelete } } }
    );
    await Room.updateMany(
      { lastMessage: { $in: commentIdsToDelete } },
      { $unset: { lastMessage: "" } }
    );
  }

  if (groupRoomIds.length) {
    await Room.updateMany({ _id: { $in: groupRoomIds } }, { $pull: { users: userId } });
  }

  const impactedUserIds = Array.from(
    new Set(
      userConnections
        .flatMap((connection) => [
          connection.follower?.toString?.(),
          connection.followee?.toString?.(),
        ])
        .filter(Boolean)
    )
  ).filter((id) => id !== userId.toString());

  if (impactedUserIds.length) {
    await Promise.all(impactedUserIds.map((id) => User.recalcSocialCounts(id)));
  }

  const affectedPostIds = Array.from(
    new Set(
      [
        ...userLikes
          .filter((like) => like.targetType === "POST")
          .map((like) => like.targetId.toString()),
        ...userComments
          .filter((comment) => comment.targetType === "POST")
          .map((comment) => comment.targetId.toString()),
        ...postComments.map((comment) => comment.targetId.toString()),
      ].filter((id) => !postIdStrings.includes(id))
    )
  );

  if (affectedPostIds.length) {
    await Promise.all(affectedPostIds.map((postId) => Post.recalcEngagement(postId)));
  }

  const affectedQuoteIds = Array.from(
    new Set(
      [
        ...userLikes
          .filter((like) => like.targetType === "QUOTE")
          .map((like) => like.targetId.toString()),
        ...userComments
          .filter((comment) => comment.targetType === "QUOTE")
          .map((comment) => comment.targetId.toString()),
        ...approvedQuoteIds.map((id) => id.toString()),
      ].filter((id) => !unapprovedQuoteIdStrings.includes(id))
    )
  );

  if (affectedQuoteIds.length) {
    await Promise.all(affectedQuoteIds.map((quoteId) => recalcQuoteEngagement(quoteId)));
  }

  await User.findByIdAndDelete(userId);

  return true;
};

module.exports = { deleteUserAndRecalculate };
