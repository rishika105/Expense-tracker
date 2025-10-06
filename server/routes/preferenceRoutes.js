import express from "express";
import {
  updatePreferences,
  addPreferences,
  getPreferences,
} from "../controllers/preferenceController.js";
import {auth}  from "../middlewares/auth.js";
const router = express.Router();

router.post("/create", auth, addPreferences);
router.put("/update", auth, updatePreferences);
router.get("/", auth, getPreferences);

export default router;
