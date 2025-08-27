// Why store both?
// amount + currency: For reference, what user entered.
// baseAmount + baseCurrency: For consistent analytics (totals, graphs).
// models/Expense.js
import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true, // e.g., "USD"
    },
    baseAmount: {
      type: Number,
      required: true, // converted to base currency value
    },
    baseCurrency: {
      type: String,
      required: true, // e.g., "INR"
    },
    category: {
      type: String,
      enum: ["Food", "Travel", "Shopping", "Bills", "Other"],
      default: "Other",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Credit Card", "Debit Card", "UPI", "Bank Transfer", "Other"],
      default: "Other",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);



