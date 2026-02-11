// Simple in-memory rate limiter (for production, use Redis)
interface RateLimitStore {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitStore>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in window
}

export const rateLimitConfigs = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 requests per 15 minutes
  api: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 requests per minute
  strict: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 requests per hour (password reset)
};

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = identifier;
  const now = Date.now();
  const record = store.get(key);

  // Clean up expired entries (simple cleanup)
  if (record && now > record.resetTime) {
    store.delete(key);
  }

  const currentRecord = store.get(key);

  if (!currentRecord) {
    // First request
    const resetTime = now + config.windowMs;
    store.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: config.maxRequests - 1, resetTime };
  }

  if (currentRecord.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: currentRecord.resetTime,
    };
  }

  // Increment count
  currentRecord.count++;
  store.set(key, currentRecord);

  return {
    allowed: true,
    remaining: config.maxRequests - currentRecord.count,
    resetTime: currentRecord.resetTime,
  };
}

export function getRateLimitHeaders(result: {
  remaining: number;
  resetTime: number;
}) {
  return {
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
  };
}

// Cleanup old entries periodically (run this in a background job)
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now > record.resetTime) {
      store.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
