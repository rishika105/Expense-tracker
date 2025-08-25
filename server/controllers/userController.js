const User = require("../models/User");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const emailSender = require("../utils/emailSender");
const bcrypt = require("bcrypt");
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
    await emailSender(email, "Here is your one-time-password ", `<div>It will expire soon use it fast </div>${otp}`);

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
    if(now - user.otpCreatedAt > 300000){
        return res.status(400).json({
            success: false,
            message: "OTP expired"
        })
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
    user.otp = null;
    user.otpCreatedAt = null;
    await user.save();

    //generate jwt will be logged in for 90d
    const token = jwt.sign(
      { email: user.email, userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "90d" }
    );

    //return token to frontend
     return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
    });

  } catch (error) {
     console.error("Error in verifying otp:", error);
    return res.status(500).json({
      success: false,
      message: "Something went with server",
    });
  }
};
