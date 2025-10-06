import mongoose from "mongoose";
import Preference from "./Preference.js";
import Expense  from "./Expense.js";

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
  // For OTP login
  isVerified: {
    type: Boolean,
    default: false,
  },
  // Profile details
  fullName: {
    type: String,
    trim: true, //idhar required true nhi coz hum pehle null bharenge while verification baad mai update krenge
  },
  userName: {
    type: String,
    unique: true,
    sparse: true, // allows nulls but unique if filled
  },
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
  },
  phone: {
    type: String,
  },
});

// Pre hook before deleting a user
userSchema.pre("findByIdAndDelete", async function (next) {
  const user = await this.model.findOne(this.getFilter());
  if (user) {
    await Preference.deleteOne({ userId: user._id });
    await Expense.deleteMany({ userId: user._id });
  }
  return next();
});

export default mongoose.model("User", userSchema);
