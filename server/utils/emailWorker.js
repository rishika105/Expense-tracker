const emailWorker = new Worker(
  "email-queue",
  async (job) => {
    const { email, subject, body, userId, threshold } = job.data;
    
    console.log(`Processing email job ${job.id} for user ${userId}`);
    
    try {
      // Add rate limiting logic if needed
      const rateLimitKey = `email_rate_limit:${userId}`;
      const emailsSentToday = await connection.get(rateLimitKey) || 0;
      
      // Limit to 10 budget alert emails per user per day
      if (parseInt(emailsSentToday) >= 10) {
        throw new Error(`Daily email limit exceeded for user ${userId}`);
      }

      // Send email
      const result = await emailSender(email, subject, body);
      
      // Increment rate limit counter
      await connection.incr(rateLimitKey);
      await connection.expire(rateLimitKey, 24 * 60 * 60); // Expire after 24 hours
      
      // Log successful email
      console.log(`Budget alert email sent successfully to ${email} (${threshold ? (threshold * 100).toFixed(0) + '%' : 'N/A'} threshold)`);
      
      return result;
    } catch (error) {
      console.error(`Failed to send email to ${email}:`, error.message);
      throw error; // This will mark the job as failed and trigger retries
    }
  },
  {
    connection,
    concurrency: 5, // Process up to 5 email jobs concurrently
    removeOnComplete: 100,
    removeOnFail: 50,
  }
);

// Worker event listeners
emailWorker.on("completed", (job) => {
  console.log(`Email worker completed job ${job.id}`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Email worker failed job ${job.id}:`, err.message);
  
  // You could add logic here to handle specific failures
  // For example, add to a dead letter queue or send admin notification
  if (job.attemptsMade === job.opts.attempts) {
    console.error(`Email job ${job.id} exhausted all retry attempts`);
    // Could notify admin or log to external service
  }
});

emailWorker.on("stalled", (job) => {
  console.warn(`Email worker stalled on job ${job.id}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down email worker...');
  await emailWorker.close();
  await connection.quit();
});

process.on('SIGINT', async () => {
  console.log('Shutting down email worker...');
  await emailWorker.close();
  await connection.quit();
});

module.exports = emailWorker;

