import { redisClient } from '../config/redis.js';
import { Click } from '../models/click.model.js';

let workerTimer;

export const startClickWorker = () => {
  if (workerTimer) return;

  workerTimer = setInterval(async () => {
    try {
      // Pull up to 500 queued clicks at once from Redis
      const rawClicks = await redisClient.rpop('clicks:queue', 500);
      if (!rawClicks || (Array.isArray(rawClicks) && rawClicks.length === 0)) return;

      const items = Array.isArray(rawClicks) ? rawClicks : [rawClicks];
      const validClicks = [];

      for (const item of items) {
        if (!item) continue;
        try {
          const parsed = typeof item === 'string' ? JSON.parse(item) : item;
          if (parsed && parsed.clickId) {
            validClicks.push(parsed);
          }
        } catch (e) {
          // ignore corrupted JSON items
        }
      }

      if (validClicks.length > 0) {
        await Click.insertMany(validClicks, { ordered: false });
        console.log(`[Worker] Flushed ${validClicks.length} clicks to MongoDB.`);
      }
    } catch (error) {
      // Code 11000 is duplicate key, which can safely be ignored on retries
      if (error.code !== 11000) {
        console.error('[Worker] Processing error:', error.message);
      }
    }
  }, 200);
};

export const stopClickWorker = () => {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = undefined;
  }
};