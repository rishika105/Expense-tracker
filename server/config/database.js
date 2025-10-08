const mongoose = require("mongoose");
require("dotenv").config();

exports.connect = () => {
  mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => console.log("📦 MongoDB connected successfully"))
    .catch((error) => {
      console.log("MongoDB connection failed");
      console.error(error);
      process.exit(1);
    });
};
