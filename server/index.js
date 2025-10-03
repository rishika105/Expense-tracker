const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const database = require("./config/database");
const userRoutes = require("./routes/userRoutes");
const preferenceRoutes = require("./routes/preferenceRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const PORT = process.env.PORT || 5000;

dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors()); //allow all

database.connect();

// Optional: Add queue monitoring endpoint (only for development/admin)
if (process.env.NODE_ENV !== 'production') {
  const { createBullBoard } = require('@bull-board/api');
  const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
  const { ExpressAdapter } = require('@bull-board/express');
  const emailQueue = require('./utils/emailQueue');

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const { addQueue } = createBullBoard({
    queues: [new BullMQAdapter(emailQueue)],
    serverAdapter: serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());
  console.log('Queue monitoring available at: http://localhost:5000/admin/queues');
}


app.use("/api/v1", userRoutes);
app.use("/api/v1/preference", preferenceRoutes);
app.use("/api/v1/expense", expenseRoutes);

app.listen(PORT, () => {
  console.log(`Server started on PORT ${PORT}`);
});
