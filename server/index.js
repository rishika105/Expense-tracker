const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const database = require("./config/database");
const userRoutes = require("./routes/userRoutes");
const preferenceRoutes = require("./routes/preferenceRoutes")
const PORT = process.env.PORT || 5000;

dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors()); //allow all

database.connect();

app.use("/api/v1", userRoutes);
app.use("/api/v1/preference", preferenceRoutes);

app.listen(PORT, () => {
  console.log(`Server started on PORT ${PORT}`);
});
