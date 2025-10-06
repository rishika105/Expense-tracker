import express from "express";
const app = express();
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import preferenceRoutes from "./routes/preferenceRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
// import { emailWorker } from "./utils/emailWorker.js"; // This starts the worker
import "dotenv/config";
import { dbconnect } from "./config/database.js";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import {emailQueue} from "./utils/emailQueue.js";

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors()); //allow all

dbconnect();

// Optional: Add queue monitoring endpoint (only for development/admin)
if (process.env.NODE_ENV !== "production") {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  const { addQueue } = createBullBoard({
    queues: [new BullMQAdapter(emailQueue)],
    serverAdapter: serverAdapter,
  });

  app.use("/admin/queues", serverAdapter.getRouter());
  console.log(
    "Queue monitoring available at: http://localhost:5000/admin/queues"
  );
}

app.use("/api/v1", userRoutes);
app.use("/api/v1/preference", preferenceRoutes);
app.use("/api/v1/expense", expenseRoutes);

app.listen(PORT, () => {
  console.log(`Server started on PORT ${PORT}`);
});
