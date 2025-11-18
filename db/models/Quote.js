const mongoose = require("mongoose");

const QuoteSchema = new mongoose.Schema({
  text: { type: String },
  isApproved: { type: Boolean, default: false },
  instaHandle: { type: String },
  isUsed: { type: Boolean, default: false },
});

module.exports = mongoose.model("Quote", QuoteSchema);
