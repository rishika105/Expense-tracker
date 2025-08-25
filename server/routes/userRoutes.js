const express = require("express");
const { sendOtp, verifyOtp } = require("../controllers/userController");
const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-email", verifyOtp);

module.exports = router;
