const express = require("express");
const {
  sendOtp,
  verifyOtp,
  updateProfile,
  getUserDetails,
  deleteUser,
} = require("../controllers/userController");
const { auth } = require("../middlewares/auth");
const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-email", verifyOtp);
router.put("/update-profile", auth, updateProfile);
router.get("/get-user-details", auth, getUserDetails);
router.delete("/delete-user", auth, deleteUser);

module.exports = router;
