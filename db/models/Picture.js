const mongoose = require("mongoose");

const PictureSchema = new mongoose.Schema(
  {
    url: { type: String, required: true }, // Cloudflare public URL

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    publicId: { type: String }, // Cloudflare id for deletion/updates

    provider: {
      type: String,
      enum: ["Cloudflare"],
      default: "Cloudflare",
    },
    comment: { type: mongoose.Schema.ObjectId, ref: "Comment" },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Picture", PictureSchema);
