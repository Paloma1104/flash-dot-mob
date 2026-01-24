import { addBreadcrumb } from '../sentry';

/**
 * Rate Limiter Service
 * 
 * Prevents abuse by limiting:
 * - Claims per user per time window
 * - API requests per user
 * - Failed attempts
 * 
 * Uses sliding window algorithm for accurate rate limiting.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
  blocked: boolean;
  blockedUntil: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  blockDurationMs: number; // How long to block after exceeding limit
}

// Rate limit configurations
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Claims: 10 per hour
  claim: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    blockDurationMs: 60 * 60 * 1000, // 1 hour block
  },
  // API requests: 100 per minute
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    blockDurationMs: 5 * 60 * 1000, // 5 minutes block
  },
  // Failed claims: 5 per hour (to detect bots)
  failedClaim: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    blockDurationMs: 24 * 60 * 60 * 1000, // 24 hour block
  },
  // Location updates: 60 per minute (1 per second max)
  location: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    blockDurationMs: 5 * 60 * 1000, // 5 minutes block
  },
};

// In-memory storage (use Redis in production)
const rateLimitStore: Map<string, RateLimitEntry> = new Map();

/**
 * Get storage key for rate limit
 */
function getKey(userId: string, action: string): string {
  return `${action}:${userId}`;
}

/**
 * Check if a user is rate limited for an action
 */
export function isRateLimited(
  userId: string,
  action: keyof typeof RATE_LIMITS
): { limited: boolean; remaining: number; resetIn: number } {
  const config = RATE_LIMITS[action];
  if (!config) {
    return { limited: false, remaining: 999, resetIn: 0 };
  }

  const key = getKey(userId, action);
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Check if currently blocked
  if (entry?.blocked && entry.blockedUntil > now) {
    return {
      limited: true,
      remaining: 0,
      resetIn: entry.blockedUntil - now,
    };
  }

  // Check if window has expired
  if (!entry || now - entry.windowStart > config.windowMs) {
    // Reset window
    rateLimitStore.set(key, {
      count: 0,
      windowStart: now,
      blocked: false,
      blockedUntil: 0,
    });
    return {
      limited: false,
      remaining: config.maxRequests,
      resetIn: config.windowMs,
    };
  }

  // Calculate remaining
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetIn = config.windowMs - (now - entry.windowStart);

  return {
    limited: remaining === 0,
    remaining,
    resetIn,
  };
}

/**
 * Record a request/action for rate limiting
 */
export function recordAction(
  userId: string,
  action: keyof typeof RATE_LIMITS
): { success: boolean; remaining: number; resetIn: number } {
  const config = RATE_LIMITS[action];
  if (!config) {
    return { success: true, remaining: 999, resetIn: 0 };
  }

  const key = getKey(userId, action);
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  // Check if currently blocked
  if (entry?.blocked && entry.blockedUntil > now) {
    addBreadcrumb('security', 'Rate limit blocked request', {
      userId,
      action,
      blockedUntil: new Date(entry.blockedUntil).toISOString(),
    });
    
    return {
      success: false,
      remaining: 0,
      resetIn: entry.blockedUntil - now,
    };
  }

  // Reset if window expired
  if (!entry || now - entry.windowStart > config.windowMs) {
    entry = {
      count: 0,
      windowStart: now,
      blocked: false,
      blockedUntil: 0,
    };
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    entry.blocked = true;
    entry.blockedUntil = now + config.blockDurationMs;
    rateLimitStore.set(key, entry);

    addBreadcrumb('security', 'Rate limit exceeded', {
      userId,
      action,
      count: entry.count,
      blockedUntil: new Date(entry.blockedUntil).toISOString(),
    });

    return {
      success: false,
      remaining: 0,
      resetIn: config.blockDurationMs,
    };
  }

  rateLimitStore.set(key, entry);

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetIn: config.windowMs - (now - entry.windowStart),
  };
}

/**
 * Clear rate limit for a user (admin action)
 */
export function clearRateLimit(userId: string, action?: keyof typeof RATE_LIMITS): void {
  if (action) {
    rateLimitStore.delete(getKey(userId, action));
  } else {
    // Clear all actions for this user
    for (const key of rateLimitStore.keys()) {
      if (key.endsWith(`:${userId}`)) {
        rateLimitStore.delete(key);
      }
    }
  }
}

/**
 * Get rate limit status for a user
 */
export function getRateLimitStatus(userId: string): Record<string, {
  count: number;
  remaining: number;
  blocked: boolean;
  resetIn: number;
}> {
  const status: Record<string, any> = {};
  const now = Date.now();

  for (const [action, config] of Object.entries(RATE_LIMITS)) {
    const key = getKey(userId, action);
    const entry = rateLimitStore.get(key);

    if (!entry || now - entry.windowStart > config.windowMs) {
      status[action] = {
        count: 0,
        remaining: config.maxRequests,
        blocked: false,
        resetIn: config.windowMs,
      };
    } else {
      status[action] = {
        count: entry.count,
        remaining: Math.max(0, config.maxRequests - entry.count),
        blocked: entry.blocked && entry.blockedUntil > now,
        resetIn: entry.blocked ? entry.blockedUntil - now : config.windowMs - (now - entry.windowStart),
      };
    }
  }

  return status;
}
