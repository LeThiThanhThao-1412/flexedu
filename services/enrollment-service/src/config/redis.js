// services/enrollment-service/src/config/redis.js
const { createClient } = require('redis');

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`
});

redisClient.on('error', (err) => console.error('Redis Error:', err));
redisClient.on('connect', () => console.log('✅ Redis connected'));

// Lưu client gốc để dùng keys command
redisClient.client = redisClient;

redisClient.connect();

module.exports = redisClient;