import Redis from 'ioredis';
import { ENV } from './app.config';

let redisClient: Redis | null = null;

export function getRedis(): Redis | null {
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  if (!ENV.REDIS_URL) {
    console.warn('⚠️  REDIS_URL not set — caching disabled');
    return;
  }
  try {
    redisClient = new Redis(ENV.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    await redisClient.connect();
    console.log('✅ Redis connected');
    redisClient.on('error', (err) => console.error('Redis error:', err));
  } catch (err) {
    console.error('❌ Redis connection failed (running without cache):', err);
    redisClient = null;
  }
}

// ── Cache helpers ─────────────────────────────────────────────────────────────
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redisClient) return null;
  try {
    const val = await redisClient.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch { return null; }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!redisClient) return;
  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
  } catch { /* silent */ }
}

export async function cacheDel(key: string): Promise<void> {
  if (!redisClient) return;
  try { await redisClient.del(key); } catch { /* silent */ }
}
