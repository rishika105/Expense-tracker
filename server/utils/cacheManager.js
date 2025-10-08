const Redis = require("ioredis");

class CacheManager {
  constructor() {
    this.redis = new Redis(process.env.VALKEY_URL || "redis://localhost:6379");
  }

  // Generic cache methods
  async get(key) {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async set(key, data, ttlSeconds = 3600) {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error("Cache del error:", error);
      return false;
    }
  }

  async invalidatePattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return keys.length;
    } catch (error) {
      console.error("Cache invalidate pattern error:", error);
      return 0;
    }
  }

  // Budget-specific cache methods
  async getBudgetCache(userId, resetCycle) {
    const now = new Date();
    let startDate;

    switch (resetCycle) {
      case "weekly":
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + daysToMonday
        );
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const periodKey = startDate.toISOString().split("T")[0];
    const cacheKey = `budget:${userId}:${resetCycle}:${periodKey}`;

    return await this.get(cacheKey);
  }

  async setBudgetCache(userId, resetCycle, data) {
    const now = new Date();
    let endDate;

    switch (resetCycle) {
      case "weekly":
        const dayOfWeek = now.getDay();
        const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + daysToSunday
        );
        endDate.setHours(23, 59, 59, 999);
        break;
      case "monthly":
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "yearly":
        endDate = new Date(now.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
    }

    const ttlMs = endDate.getTime() - Date.now() + 24 * 60 * 60 * 1000; // Add 1 day buffer
    const ttlSeconds = Math.max(60, Math.floor(ttlMs / 1000));

    const now2 = new Date();
    let startDate;

    switch (resetCycle) {
      case "weekly":
        const dayOfWeek2 = now2.getDay();
        const daysToMonday = dayOfWeek2 === 0 ? -6 : 1 - dayOfWeek2;
        startDate = new Date(
          now2.getFullYear(),
          now2.getMonth(),
          now2.getDate() + daysToMonday
        );
        break;
      case "monthly":
        startDate = new Date(now2.getFullYear(), now2.getMonth(), 1);
        break;
      case "yearly":
        startDate = new Date(now2.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now2.getFullYear(), now2.getMonth(), 1);
    }

    const periodKey = startDate.toISOString().split("T")[0];
    const cacheKey = `budget:${userId}:${resetCycle}:${periodKey}`;

    return await this.set(cacheKey, data, ttlSeconds);
  }

  async invalidateBudgetCache(userId, resetCycle) {
    const pattern = `budget:${userId}:${resetCycle}:*`;
    return await this.invalidatePattern(pattern);
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
