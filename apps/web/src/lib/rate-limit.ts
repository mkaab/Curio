type RateLimitStore = Map<string, { count: number; resetTime: number }>;

const store: RateLimitStore = new Map();

/**
 * A simple in-memory rate limiter.
 * Note: In a serverless environment (like Vercel), this state is kept per-lambda-instance.
 * It is sufficient for basic spam prevention but not perfectly globally synchronized.
 */
export function rateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 60000 // 1 minute
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  
  // Clean up expired entries occasionally to prevent memory leaks
  if (Math.random() < 0.05) {
    for (const [key, value] of store.entries()) {
      if (value.resetTime < now) {
        store.delete(key);
      }
    }
  }

  const record = store.get(identifier);

  if (!record || record.resetTime < now) {
    store.set(identifier, { count: 1, resetTime: now + windowMs });
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0, reset: record.resetTime };
  }

  record.count += 1;
  store.set(identifier, record);

  return { success: true, limit, remaining: limit - record.count, reset: record.resetTime };
}
