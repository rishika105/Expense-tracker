const User = require("../models/User");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const emailSender = require("../utils/emailSender");
const bcrypt = require("bcrypt");
const Preference = require("../models/Preference");
require("dotenv").config();

// OTP Based Authentication
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // validate
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // check if user exists
    let user = await User.findOne({ email });

    // generate OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const hashedOtp = await bcrypt.hash(otp, 10);

    if (user) {
      // update OTP if already signed up
      user.otp = hashedOtp;
      user.otpCreatedAt = Date.now();
      await user.save();
    } else {
      // create new user
      user = await User.create({
        email,
        otp: hashedOtp,
        otpCreatedAt: Date.now(),
      });
    }

    // send OTP via email
    await emailSender(
      email,
      "Here is your one-time-password ",
      `<div>It will expire soon use it fast </div>${otp}`
    );

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Error in sending otp:", error);
    return res.status(500).json({
      success: false,
      message: "Something went with server",
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    //verify if the otp is valid and present
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({
        success: false,
        message: "Empty fields",
      });

    //bcrypt gives diff hash everytime even with same val
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    //check OTP expiry (5min - 300000 ms)
    const now = Date.now();
    if (now - user.otpCreatedAt > 300000) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // compare OTP with hash
    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    //otp is present and valid
    //clear OTP after success login
    let verified = true;
    user.otp = null;
    user.otpCreatedAt = null;
    if (!user.isVerified) {
      verified = false; //send in frontend to show startup form
      user.isVerified = true; //update in db for first time only
    }
    await user.save();

    //generate jwt will be logged in for 90d
    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "90d" }
    );

    //return token to frontend
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
      verified,
    });
  } catch (error) {
    console.error("Error in verifying otp:", error);
    return res.status(500).json({
      success: false,
      message: "Something went with server",
    });
  }
};

//we already have null fields for db model just update it even on filling first time
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; //from middle ware
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    const { fullName, userName, phone, dateOfBirth, gender } = req.body;

    if (!fullName || !userName || !phone || !dateOfBirth || !gender) {
      return res.status(400).json({
        success: false,
        message: "Some fields are missing",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { fullName, userName, phone, dateOfBirth, gender },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "User details updated or added successfully",
      updatedUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error for updating profile",
    });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const email = req.user.email; //from middle ware
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email not found",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error for fetching user details",
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.user.id; //from middle ware
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    await User.findOneAndDelete({ userId });

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error for deleting user",
    });
  }
};
