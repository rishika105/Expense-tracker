const { Queue } = require("bullmq");
const Redis = require("ioredis");

const connection = new Redis(process.env.VALKEY_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  connectTimeout: 60000,
  commandTimeout: 5000,
});

const emailQueue = new Queue("email-queue", { 
  connection,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  }
});

// Add queue event listeners for monitoring
emailQueue.on('completed', (job) => {
  console.log(`Email job ${job.id} completed successfully`);
});

emailQueue.on('failed', (job, err) => {
  console.error(`Email job ${job.id} failed:`, err.message);
});

emailQueue.on('stalled', (job) => {
  console.warn(`Email job ${job.id} stalled`);
});

module.exports = emailQueue;


