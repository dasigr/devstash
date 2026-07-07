import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Sliding-window rate limiting for auth endpoints, backed by Upstash Redis
// (serverless-friendly — REST, no persistent connections). Every limiter here
// FAILS OPEN: if Upstash isn't configured or is unreachable, requests are
// allowed through rather than blocking authentication entirely.

// Per-endpoint limits. `window` uses Upstash's duration format ("15 m", "1 h").
export const RATE_LIMITS = {
  // Login is keyed by IP + email; the rest by IP (see each route).
  login: { limit: 5, window: "15 m", prefix: "rl:login" },
  register: { limit: 3, window: "1 h", prefix: "rl:register" },
  forgotPassword: { limit: 3, window: "1 h", prefix: "rl:forgot" },
  resetPassword: { limit: 5, window: "15 m", prefix: "rl:reset" },
  resendVerification: { limit: 3, window: "15 m", prefix: "rl:resend" },
} as const satisfies Record<
  string,
  { limit: number; window: `${number} ${"ms" | "s" | "m" | "h" | "d"}`; prefix: string }
>;

export type RateLimitKey = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  success: boolean;
  /** Remaining requests in the current window. */
  remaining: number;
  /** Epoch ms when the window resets and requests are allowed again. */
  reset: number;
  /** The configured limit for this window. */
  limit: number;
}

// Lazily create the Redis client from env. Cached across invocations (including
// the `null` "not configured" result) so we only read env / construct once.
let redisClient: Redis | null | undefined;
function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisClient = null;
    return null;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

// One Ratelimit instance per endpoint, created lazily and reused so Upstash's
// ephemeral in-memory cache can smooth out repeated checks.
const limiters = new Map<RateLimitKey, Ratelimit>();
function getLimiter(key: RateLimitKey): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  let limiter = limiters.get(key);
  if (!limiter) {
    const config = RATE_LIMITS[key];
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, config.window),
      prefix: config.prefix,
      analytics: false,
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

/**
 * Check (and consume) a rate-limit token for `identifier` against the given
 * endpoint's limit. Fails open — returns `success: true` when Upstash is
 * unconfigured or errors, so a Redis outage never locks users out of auth.
 */
export async function checkRateLimit(
  key: RateLimitKey,
  identifier: string,
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[key];
  const limiter = getLimiter(key);

  // Not configured — allow through (fail open).
  if (!limiter) {
    return { success: true, remaining: config.limit, reset: Date.now(), limit: config.limit };
  }

  try {
    const { success, remaining, reset, limit } = await limiter.limit(identifier);
    return { success, remaining, reset, limit };
  } catch (error) {
    // Upstash unreachable — log and allow through (fail open).
    console.error(`Rate limit check failed for "${key}":`, error);
    return { success: true, remaining: config.limit, reset: Date.now(), limit: config.limit };
  }
}

/**
 * Best-effort client IP from proxy headers. On Vercel the real client IP is the
 * first entry in `x-forwarded-for`. Falls back to `x-real-ip`, then a constant
 * bucket so limiting still applies (e.g. local dev without a proxy).
 */
export function ipFromHeaders(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

/** Convenience wrapper for a `Request` (route handlers). */
export function getClientIp(request: Request): string {
  return ipFromHeaders(request.headers);
}

/**
 * Build the 429 response for a blocked request: a friendly, minutes-based
 * message plus a `Retry-After` header (seconds) per the HTTP spec.
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));

  return NextResponse.json(
    {
      success: false,
      error: `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
