const { Queue } = require("bullmq");
const Redis = require("ioredis");

const connection = new Redis(process.env.VALKEY_URL || "redis://localhost:6379");

const emailQueue = new Queue("email-queue", { connection });

module.exports = emailQueue;
