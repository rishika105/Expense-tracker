const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
  },
  otpCreatedAt: {
    type: Date,
  },
});

module.exports = mongoose.model("User", userSchema);
