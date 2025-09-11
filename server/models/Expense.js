// Why store both?
// amount + currency: For reference, what user entered.
// baseAmount + baseCurrency: For consistent analytics (totals, graphs).
// models/Expense.js
import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,  //eg: 5 
    },
    currency: {
      type: String,
      required: true, // e.g., "USD"
    },
    baseAmount: {
      type: Number,
      required: true, // converted to base currency value
      // 5 USD -> If base currency is INR ->  440.07
    },
    baseCurrency: {
      type: String,
      required: true, // e.g., "INR"
    },
    category: {
      type: String,
      required: true,  //food, travel
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
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);



