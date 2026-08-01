import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

// Graceful fallback if Upstash Redis credentials are not configured yet
export const redis = (url && token && !url.includes('example'))
  ? new Redis({ url, token })
  : null;

/**
 * Sets a 30-minute check-in timer key in Redis for a specific user ID
 * @param userId - Unique user ID
 * @param ttlSeconds - Expiration time in seconds (default 1800s = 30m)
 */
export async function setUserCheckInTimer(userId: string, ttlSeconds: number = 1800) {
  if (!redis) {
    console.log(`[Redis Mock] Timer set for user ${userId} with TTL ${ttlSeconds}s`);
    return true;
  }
  
  // Set main active key (1800s = 30 min)
  await redis.set(`user:${userId}:active`, 'OK', { ex: ttlSeconds });
  // Set warning key (1500s = 25 min) to trigger push notification before full expiration
  const warningTtl = Math.max(60, ttlSeconds - 300);
  await redis.set(`user:${userId}:warning`, 'OK', { ex: warningTtl });
  
  return true;
}

/**
 * Checks timer status for a user ID
 */
export async function getUserCheckInTimer(userId: string) {
  if (!redis) return { active: true, warning: true };

  const [active, warning] = await Promise.all([
    redis.get(`user:${userId}:active`),
    redis.get(`user:${userId}:warning`)
  ]);

  return {
    active: active === 'OK',
    warning: warning === 'OK'
  };
}
