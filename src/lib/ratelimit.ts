import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Check if Upstash config is available
const hasUpstashConfig = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// Create a noop ratelimiter for development/missing config
const noopRatelimit = {
  limit: async (_identifier: string) => ({
    success: true,
    limit: 10,
    reset: Date.now() + 60000,
    remaining: 10,
  }),
};

// Only create real ratelimiter if config is available
let ratelimitInstance: Ratelimit | typeof noopRatelimit;

if (hasUpstashConfig) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  ratelimitInstance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'yeoskin:ratelimit',
  });
} else {
  console.warn('[Ratelimit] Upstash config not found, using noop ratelimiter');
  ratelimitInstance = noopRatelimit;
}

export const ratelimit = ratelimitInstance;
