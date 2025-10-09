const Redis = require("ioredis");
const { getCurrentPeriodDateRange } = require("./findDateRange");

class CacheManager {
  constructor() {
    this.redis = new Redis(process.env.VALKEY_URL || "redis://localhost:6379");
  }

  // Generate cache key for budget totals
  async getBudgetCacheKey(userId, resetCycle) {
    const { startDate } = getCurrentPeriodDateRange(resetCycle);
    const periodKey = startDate.toISOString().split("T")[0]; // YYYY-MM-DD
    return `budget:${userId}:${resetCycle}:${periodKey}`;
  }

  // Get cached budget total
  async getCachedBudgetTotal(userId, resetCycle) {
    try {
      const cacheKey = await this.getBudgetCacheKey(userId, resetCycle);
      const cachedData = await this.redis.get(cacheKey);

      if (cachedData) {
        return JSON.parse(cachedData);
      }
      return null;
    } catch (error) {
      console.error("Error getting cached budget total:", error);
      return null;
    }
  }

  // Set cached budget total
  async setCachedBudgetTotal(userId, resetCycle, data) {
    try {
      const cacheKey = await this.getBudgetCacheKey(userId, resetCycle);
      const { startDate, endDate } = getCurrentPeriodDateRange(resetCycle);

      // Calculate TTL - cache until end of current period + 1 day
      const ttlMs = endDate.getTime() - Date.now() + 24 * 60 * 60 * 1000;
      const ttlSeconds = Math.max(60, Math.floor(ttlMs / 1000)); // Minimum 1 minute

      await this.redis.setex(cacheKey, ttlSeconds, JSON.stringify(data));
    } catch (error) {
      console.error("Error setting cached budget total:", error);
    }
  }

  // Update cached budget total incrementally
  async updateCachedBudgetTotal(userId, resetCycle, newExpenseAmount) {
    try {
      const cachedData = await this.getCachedBudgetTotal(userId, resetCycle);

      if (cachedData) {
        // Validate cached data before updating
        if (
          typeof cachedData.total !== "number" ||
          typeof cachedData.count !== "number"
        ) {
          console.warn("Invalid cached data detected, invalidating cache");
          await this.invalidateBudgetCache(userId, resetCycle);
          return null;
        }

        const updatedData = {
          ...cachedData,
          total: Number(
            (cachedData.total + Number(newExpenseAmount)).toFixed(2)
          ), //all converted to num
          count: cachedData.count + 1,
        };

        console.log("Cache update:", {
          previous: cachedData.total,
          added: newExpenseAmount,
          new: updatedData.total,
        });

        await this.setCachedBudgetTotal(userId, resetCycle, updatedData);
        return updatedData;
      }
      return null;
    } catch (error) {
      console.error("Error updating cached budget total:", error);
      return null;
    }
  }

  // Invalidate cache (called when expenses are deleted/modified)
  async invalidateBudgetCache(userId, resetCycle) {
    try {
      const cacheKey = await this.getBudgetCacheKey(userId, resetCycle);
      await this.redis.del(cacheKey);
    } catch (error) {
      console.error("Error invalidating budget cache:", error);
    }
  }

  async getQueueStats() {
    try {
      const emailQueue = require("../email/emailQueue");
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        emailQueue.getWaiting(),
        emailQueue.getActive(),
        emailQueue.getCompleted(),
        emailQueue.getFailed(),
        emailQueue.getDelayed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total:
          waiting.length +
          active.length +
          completed.length +
          failed.length +
          delayed.length,
      };
    } catch (error) {
      console.error("Error getting queue stats:", error);
      return null;
    }
  }

  async getHealthStatus() {
    try {
      // Test Redis connection
      const pong = await this.redis.ping();
      const queueStats = await this.getQueueStats();

      return {
        redis: pong === "PONG" ? "healthy" : "unhealthy",
        cache: pong === "PONG" ? "operational" : "error",
        emailQueue: queueStats ? "operational" : "error",
        queueStats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        redis: "error",
        cache: "error",
        emailQueue: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = new CacheManager();
