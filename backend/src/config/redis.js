import './env.js';
import Redis from 'ioredis';

// Fallback to local Redis if env variable is not set
const redisUrl = process.env.REDIS_URL || process.env.REDIS_URI || 'redis://127.0.0.1:6379';

export const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisClient.on('connect', () => {
  console.log('[Redis] Connected successfully.');
});

redisClient.on('error', (err) => {
  console.error('[Redis Error]:', err.message);
});