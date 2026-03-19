/**
 * Simple in-memory rate limiter using sliding window.
 * For production at scale, swap with Redis-backed implementation.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < 600_000);
      if (entry.timestamps.length === 0) store.delete(key);
    }
  }, 300_000);
}

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= config.limit) {
    const oldest = entry.timestamps[0];
    const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  entry.timestamps.push(now);
  return { allowed: true, remaining: config.limit - entry.timestamps.length };
}

/** Preset configs for common endpoints */
export const RATE_LIMITS = {
  auth: { limit: 5, windowSeconds: 60 },       // 5 attempts per minute
  api: { limit: 60, windowSeconds: 60 },        // 60 requests per minute
  passwordReset: { limit: 3, windowSeconds: 300 }, // 3 per 5 minutes
} as const;
