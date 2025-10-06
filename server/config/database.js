import mongoose from "mongoose";

export const dbconnect = () => {
  mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => console.log("DB connected successfully"))
    .catch((error) => {
      console.log("DB connection failed");
      console.error(error);
      process.exit(1);
    });
};
