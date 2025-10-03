const express = require("express");
const { addExpense } = require("../controllers/expenseController");
const { auth } = require("../middlewares/auth");

const router = express.Router();

// ============================================
// routes/admin.js - Optional admin routes for monitoring
const cacheManager = require('../utils/cacheManager.js');
const emailQueue = require('../utils/emailQueue');

// Middleware to check admin access (implement your own auth logic)
const requireAdmin = (req, res, next) => {
  // Replace with your admin authentication logic
  if (process.env.NODE_ENV !== 'production' || req.user?.isAdmin) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Admin access required' });
  }
};

// Health check endpoint
router.get('/health', requireAdmin, async (req, res) => {
  try {
    const health = await cacheManager.getHealthStatus();
    const statusCode = health.redis === 'healthy' && health.cache === 'operational' ? 200 : 503;
    res.status(statusCode).json({
      success: statusCode === 200,
      health,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
    });
  }
});

// Queue stats endpoint
router.get('/queue/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await cacheManager.getQueueStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get queue stats',
      error: error.message,
    });
  }
});

// Clear cache endpoint (use with caution)
router.delete('/cache/clear/:pattern', requireAdmin, async (req, res) => {
  try {
    const { pattern } = req.params;
    const keysCleared = await cacheManager.invalidatePattern(pattern);
    res.json({
      success: true,
      message: `Cleared ${keysCleared} cache keys matching pattern: ${pattern}`,
      keysCleared,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message,
    });
  }
});

// Retry failed jobs
router.post('/queue/retry-failed', requireAdmin, async (req, res) => {
  try {
    const failedJobs = await emailQueue.getFailed();
    let retriedCount = 0;
    
    for (const job of failedJobs) {
      await job.retry();
      retriedCount++;
    }
    
    res.json({
      success: true,
      message: `Retried ${retriedCount} failed jobs`,
      retriedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retry jobs',
      error: error.message,
    });
  }
});

// Clean old jobs
router.delete('/queue/clean', requireAdmin, async (req, res) => {
  try {
    const { type = 'completed', count = 100 } = req.query;
    const cleaned = await emailQueue.clean(5000, parseInt(count), type);
    
    res.json({
      success: true,
      message: `Cleaned ${cleaned.length} ${type} jobs`,
      cleaned: cleaned.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clean queue',
      error: error.message,
    });
  }
});

router.post("/add", auth, addExpense);


module.exports = router;
