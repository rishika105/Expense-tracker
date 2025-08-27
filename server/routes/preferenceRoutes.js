const express = require("express");
const {
  updatePreferences,
  addPreferences,
  getPreferences,
} = require("../controllers/preferenceController");
const { auth } = require("../middlewares/auth");
const router = express.Router();

router.post("/create", auth, addPreferences);
router.put("/update", auth, updatePreferences);
router.get("/", auth, getPreferences);

module.exports = router;
