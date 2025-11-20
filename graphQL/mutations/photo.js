const { AuthenticationError } = require("apollo-server-express");

const { User, Room, Comment, Picture, City } = require("../../db/models");
const axios = require("axios");
require("dotenv").config();

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID; // e.g. 367247...
const CF_API_TOKEN = process.env.CF_API_TOKEN; // API Token with Images:Edit

module.exports = {
  directUploadResolver: async (root, args, ctx) => {
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

  addPictureResolver: async (_, { token, url, publicId }) => {
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

  deletePhotoResolver: async (_, { token, photoId }) => {
    try {
      const user = await User.findOne({ token });
      if (!user) {
        throw new AuthenticationError("User not found");
      }

      // Get full picture doc to check publicId
      const pic = await Picture.findById(photoId);
      if (!pic) {
        throw new Error("Picture not found");
      }

      // Verify the picture belongs to this user
      if (pic.user.toString() !== user._id.toString()) {
        throw new AuthenticationError("Not authorized to delete this picture");
      }

      const publicId = pic.publicId;

      // Best-effort remote delete from Cloudflare (don't block DB cleanup if this fails)
      if (publicId) {
        try {
          if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
            console.warn("Missing Cloudflare credentials, skipping remote delete");
          } else {
            await axios.delete(
              `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1/${publicId}`,
              { headers: { Authorization: `Bearer ${CF_API_TOKEN}` } }
            );
            console.log("Successfully deleted image from Cloudflare:", publicId);
          }
        } catch (extErr) {
          // Log and continue; we still remove the DB reference
          console.warn(
            "Remote delete failed:",
            extErr.response?.data || extErr.message
          );
        }
      }

      // Remove picture from DB
      await Picture.deleteOne({ _id: photoId });

       // Pull reference from user and return updated user (same as before)
   

      // Pull reference from user and return updated user
      const updatedUser = await User.findByIdAndUpdate(
        { _id: user._id },
        {profilePicUrl: null},
        { $pull: { profilePic: photoId } },
        { new: true }
      )
        .populate("profilePic")
      

      return updatedUser;
    } catch (err) {

      throw new AuthenticationError(err.message);
    }
  },
};

