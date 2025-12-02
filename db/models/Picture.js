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

    /** NEW — replaces all day7/day10/day14... fields */
    milestone: {
      type: String,
      enum: [
        "none",
        "day7",
        "day10",
        "day14",
        "day30",
        "day60",
        "day90",
        "day180",
        "day365",
      ],
      default: "none",
    },

    comment: { type: mongoose.Schema.ObjectId, ref: "Comment" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Picture", PictureSchema);
