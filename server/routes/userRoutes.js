import express from "express";
import {
  sendOtp,
  verifyOtp,
  updateProfile,
  getUserDetails,
  deleteUser
}  from "../controllers/userController.js";
import {auth} from "../middlewares/auth.js";
const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-email", verifyOtp);
router.put("/update-profile", auth, updateProfile);
router.get("/get-user-details", auth, getUserDetails);
router.delete("/delete-user", auth, deleteUser);

export default router;
