import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Redis client for token counter and caching
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: false, // Disable auto-reconnect
  }
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error', err);
});

// Initialize Redis connection
export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.warn('⚠️  Redis not available - Token counter will use database fallback:', error);
    // Don't throw, allow app to continue without Redis
  }
};

// Helper functions for Redis operations
export const redisHelpers = {
  // Increment token counter (atomic operation)
  incrementTokenCounter: async (): Promise<number> => {
    const timezone = process.env.TOKEN_TIMEZONE || 'Asia/Kolkata';
    const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
    const key = `token_counter:${today}`;
    const count = await redisClient.incr(key);
    // Set expiry to end of day + 1 day (cleanup old counters)
    await redisClient.expire(key, 86400 * 2);
    return count;
  },

  // Get current token count
  getTokenCounter: async (): Promise<number> => {
    const timezone = process.env.TOKEN_TIMEZONE || 'Asia/Kolkata';
    const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
    const key = `token_counter:${today}`;
    const count = await redisClient.get(key);
    return count ? parseInt(count) : 0;
  },

  // Reset token counter (for new day)
  resetTokenCounter: async (): Promise<void> => {
    if (!redisClient.isOpen) {
      throw new Error('Redis client is not connected');
    }
    const timezone = process.env.TOKEN_TIMEZONE || 'Asia/Kolkata';
    const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
    const key = `token_counter:${today}`;
    await redisClient.set(key, '0');
  },

  // Cache pending orders count
  cachePendingOrdersCount: async (count: number): Promise<void> => {
    await redisClient.setEx('pending_orders_count', 60, count.toString());
  },

  // Get cached pending orders count
  getCachedPendingOrdersCount: async (): Promise<number | null> => {
    const count = await redisClient.get('pending_orders_count');
    return count ? parseInt(count) : null;
  },
};

export default redisClient;
