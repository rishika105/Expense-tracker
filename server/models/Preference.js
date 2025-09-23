const mongoose = require("mongoose");

const preferenceSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Expense preferences
    baseCurrency: {
      type: String,
      default: "INR", // could be USD, EUR, etc.
      required: true,
    },
    alertThresholds: {
      type: Number,
      enum: [0.5, 1],
      default: 0.5,
    }, // 50%, 100%, budget exceeded emails
    lastAlertThreshold: {
      type: Number, // last threshold already triggered
      default: 0,
    },
    budget: {
      type: Number,
      default: 0, // user can set a budget
      required: true,
    },
    notifications: {
      type: Boolean,
      default: true, // enable reminders/alerts
      required: true,
    },
    resetCycle: {
      type: String,
      enum: ["monthly", "weekly", "yearly"],
      default: "monthly",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Preference", preferenceSchema);
