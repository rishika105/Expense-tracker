// utils/redisConnection.js
const Redis = require("ioredis");


const connection = new Redis(process.env.VALKEY_URL || "redis://localhost:6379", {
  tls: {},  //starts with rediss and not redis so enable this
  maxRetriesPerRequest: null,
  connectTimeout: 20000,
//   commandTimeout: 15000,  //removing it coz after 5 sec it dosent wait more and fail the connection
//this was causing so much errorrr
});

// Debug logs
connection.on("connect", () => console.log("🔌 Redis client connected..."));
connection.on("ready", () => console.log("✅ Redis is ready to use!"));
connection.on("error", (err) => console.error("❌ Redis error:", err));
connection.on("close", () => console.warn("⚠️ Redis connection closed"));


module.exports = connection;
