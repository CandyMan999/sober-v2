const { AuthenticationError } = require("apollo-server-express");

const {
  User,
  Room,
  Comment,
  Picture,
  City,
  Venue,
  Video,
} = require("./db/models");
const axios = require("axios");
require("dotenv").config();

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID; // e.g. 367247...
const CF_API_TOKEN = process.env.CF_API_TOKEN; // API Token with Images:Edit

module.exports = {
  // =====================
  //        QUERIES
  // =====================
  Query: {
    // Get current user by device push token
    me: async (_, { token }) => {
      try {
        const user = await User.findOne({ token }).populate("profilePic");
        return user;
      } catch (err) {
        throw new AuthenticationError(err.message);
      }
    },

    // For debugging / admin; not for public production use
    users: async () => {
      try {
        const users = await User.find().populate("profilePic");
        return users;
      } catch (err) {
        throw new AuthenticationError(err.message);
      }
    },

    rooms: async () => {
      try {
        const rooms = await Room.find()
          .populate("users")
          .populate({
            path: "comments",
            populate: { path: "author" },
          });
        return rooms;
      } catch (err) {
        throw new AuthenticationError(err.message);
      }
    },

    room: async (_, { id }) => {
      try {
        const room = await Room.findById(id)
          .populate("users")
          .populate({
            path: "comments",
            populate: { path: "author replyTo" },
          });

        return room;
      } catch (err) {
        throw new AuthenticationError(err.message);
      }
    },
  },

  // =====================
  //       MUTATIONS
  // =====================
  Mutation: {
    /**
     * Create or update a user based on device token.
     * This is the main entrypoint for:
     * - setting username
     * - saving profilePicUrl
     * - setting sobrietyStartAt
     * - setting timezone
     */
    upsertUserProfile: async (
      _,
      { token, username, profilePicUrl, sobrietyStartAt, timezone }
    ) => {
      try {
        let user = await User.findOne({ token });

        if (!user) {
          user = new User({ token });
        }

        if (typeof username === "string") {
          user.username = username.trim();
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

        await user.save();
        return user;
      } catch (err) {
        throw new AuthenticationError(err.message);
      }
    },
    directUpload: async (root, args, ctx) => {
      try {
        console.log("hitting backend: ", CF_ACCOUNT_ID, CF_API_TOKEN);
        if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
          throw new Error(
            "Cloudflare credentials missing (CF_ACCOUNT_ID / CF_API_TOKEN)"
          );
        }
        console.log("hitting backend");
        const resp = await axios.post(
          "https://api.cloudflare.com/client/v4/accounts/" +
            CF_ACCOUNT_ID +
            "/images/v2/direct_upload",
          null,
          { headers: { Authorization: "Bearer " + CF_API_TOKEN } }
        );

        console.log("resp: ", resp);

        const data = resp && resp.data ? resp.data : null;
        const ok = data && data.success === true;
        const result = ok && data.result ? data.result : null;
        const uploadURL = result && result.uploadURL ? result.uploadURL : null;
        const id = result && result.id ? result.id : null;

        if (!ok || !uploadURL || !id) {
          throw new Error(
            "Cloudflare direct upload failed: " + JSON.stringify(data)
          );
        }

        return { uploadURL: uploadURL, id: id };
      } catch (err) {
        console.log("err: ", err);
        throw new AuthenticationError(err.message);
      }
    },

    /**
     * Add a relapse entry + reset sobrietyStartAt to now.
     * We'll use this when user reports a relapse.
     */
    addRelapse: async (_, { token, note }) => {
      try {
        const user = await User.findOne({ token });
        if (!user) {
          throw new AuthenticationError("User not found");
        }

        user.relapses.push({
          at: new Date(),
          note: note || "",
        });

        // Start a new streak from now
        user.sobrietyStartAt = new Date();
        // Reset milestones so they can get fresh notifications for the new streak
        user.milestonesNotified = [];

        await user.save();
        return user;
      } catch (err) {
        throw new AuthenticationError(err.message);
      }
    },

    /**
     * Create a simple community room.
     */
    createRoom: async (_, { name }) => {
      try {
        const room = await Room.create({
          name,
          users: [],
          comments: [],
        });

        return room;
      } catch (err) {
        throw new AuthenticationError(err.message);
      }
    },

    /**
     * Send a comment into a room.
     * Identifies the user by token.
     * Optionally allows replying to another comment.
     */
    sendComment: async (_, { roomId, text, token, replyTo }) => {
      try {
        const user = await User.findOne({ token });
        if (!user) {
          throw new AuthenticationError("User not found");
        }

        const room = await Room.findById(roomId);
        if (!room) {
          throw new AuthenticationError("Room not found");
        }

        const comment = await Comment.create({
          text,
          author: user._id,
          room: room._id,
          replyTo: replyTo || null,
        });

        // Add comment to room
        room.comments.push(comment._id);

        // Ensure user in room.users
        const isAlreadyInRoom = room.users.some(
          (uId) => uId.toString() === user._id.toString()
        );
        if (!isAlreadyInRoom) {
          room.users.push(user._id);
        }

        await room.save();

        // Populate for nice return
        const populatedComment = await Comment.findById(comment._id)
          .populate("author")
          .populate("replyTo");

        return populatedComment;
      } catch (err) {
        throw new AuthenticationError(err.message);
      }
    },

    /**
     * Add a Picture and associate it with the user.
     * This is where your Cloudflare upload result will land.
     */
    addPicture: async (_, { token, url, publicId }) => {
      try {
        const user = await User.findOne({ token });
        if (!user) {
          throw new AuthenticationError("User not found");
        }

        const picture = await Picture.create({
          url,
          publicId: publicId || null,
          user: user._id,
          provider: "Cloudflare",
        });

        // Attach as profilePic
        user.profilePic = picture._id;
        user.profilePicUrl = url;
        await user.save();

        const populatedPicture = await Picture.findById(picture._id).populate(
          "user"
        );

        return populatedPicture;
      } catch (err) {
        throw new AuthenticationError(err.message);
      }
    },
  },

  // =====================
  //   NESTED RESOLVERS
  // (optional – default resolvers will mostly work,
  //  but these can help if you want explicit behavior)
  // =====================

  Room: {
    users: async (room) => {
      return User.find({ _id: { $in: room.users } });
    },
    comments: async (room) => {
      return Comment.find({ _id: { $in: room.comments } }).sort({
        createdAt: 1,
      });
    },
  },

  Comment: {
    author: async (comment) => {
      if (!comment.author) return null;
      return User.findById(comment.author);
    },
    room: async (comment) => {
      if (!comment.room) return null;
      return Room.findById(comment.room);
    },
    replyTo: async (comment) => {
      if (!comment.replyTo) return null;
      return Comment.findById(comment.replyTo);
    },
  },

  Picture: {
    user: async (picture) => {
      if (!picture.user) return null;
      return User.findById(picture.user);
    },
    comment: async (picture) => {
      if (!picture.comment) return null;
      return Comment.findById(picture.comment);
    },
  },

  City: {},

  Venue: {
    city: async (venue) => {
      if (!venue.city) return null;
      return City.findById(venue.city);
    },
  },

  Video: {
    sender: async (video) => {
      if (!video.sender) return null;
      return User.findById(video.sender);
    },
    receiver: async (video) => {
      if (!video.receiver) return null;
      return User.findById(video.receiver);
    },
    comment: async (video) => {
      if (!video.comment) return null;
      return Comment.findById(video.comment);
    },
  },
};
