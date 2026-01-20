/**
 * Rate Limiting with Upstash Redis or In-Memory fallback
 * Supports IP-based and key-based limiting
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Check if Upstash config is available
const hasUpstashConfig = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
)

// In-memory rate limiter for development/fallback
class InMemoryRateLimiter {
  private requests: Map<string, { count: number; resetAt: number }> = new Map()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs

    // Cleanup old entries every minute
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 60000)
    }
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.requests.entries()) {
      if (value.resetAt < now) {
        this.requests.delete(key)
      }
    }
  }

  async limit(identifier: string): Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: number
  }> {
    const now = Date.now()
    const entry = this.requests.get(identifier)

    if (!entry || entry.resetAt < now) {
      // New window
      this.requests.set(identifier, {
        count: 1,
        resetAt: now + this.windowMs,
      })
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: now + this.windowMs,
      }
    }

    if (entry.count >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: entry.resetAt,
      }
    }

    entry.count++
    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - entry.count,
      reset: entry.resetAt,
    }
  }
}

// Rate limiter interface
interface RateLimiterResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

interface RateLimiterInstance {
  limit: (identifier: string) => Promise<RateLimiterResult>
}

// Create rate limiter instance
let ratelimitInstance: RateLimiterInstance

if (hasUpstashConfig) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })

  ratelimitInstance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'yeoskin:ratelimit',
  })

  console.info('[Ratelimit] Using Upstash Redis')
} else {
  // Fallback to in-memory rate limiter
  ratelimitInstance = new InMemoryRateLimiter(10, 60000) // 10 requests per minute
  console.warn('[Ratelimit] Upstash config not found, using in-memory rate limiter')
}

export const ratelimit = ratelimitInstance

// Specific rate limiters for different endpoints
export const checkoutRatelimit: RateLimiterInstance = hasUpstashConfig
  ? new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      }),
      limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 checkouts per minute per IP
      analytics: true,
      prefix: 'yeoskin:checkout',
    })
  : new InMemoryRateLimiter(5, 60000)

// Stricter rate limiter for anonymous endpoints
export const anonRatelimit: RateLimiterInstance = hasUpstashConfig
  ? new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      }),
      limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 requests per minute
      analytics: true,
      prefix: 'yeoskin:anon',
    })
  : new InMemoryRateLimiter(20, 60000)

// Helper to get client IP from request
export function getClientIp(request: Request): string {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Vercel specific
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for')
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim()
  }

  return 'unknown'
}

// Helper to create rate limit response
export function rateLimitResponse(reset: number): Response {
  const retryAfter = Math.ceil((reset - Date.now()) / 1000)
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(reset),
      },
    }
  )
}
