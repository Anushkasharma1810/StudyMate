import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

/**
 * Small in-memory "fixed window" rate limiter.
 *
 * Why: the live site uses ONE server-side AI key for every visitor. Without limits, a single
 * person (or a bot) could use up the whole AI quota and the demo would stop working.
 *
 * How: each client gets a counter per time window (e.g. 40 requests per 10 minutes).
 * When the counter passes the limit we reply 429 "Too Many Requests" until the window resets.
 * Counters live in memory, which is fine for a single server instance.
 */
interface LimiterOptions {
  name: string;
  windowMs: number;
  max: number;
  /** Who is being limited: the logged-in user (default) or the IP address */
  keyBy?: 'user' | 'ip' | 'global';
  message: string;
}

type Bucket = { count: number; resetAt: number };
const allBuckets: Map<string, Bucket>[] = [];

function clientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function createRateLimiter(opts: LimiterOptions) {
  const buckets = new Map<string, Bucket>();
  allBuckets.push(buckets);

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as AuthRequest).user?.id;
    const key =
      opts.keyBy === 'global' ? 'global'
      : opts.keyBy === 'ip' || !userId ? `ip:${clientIp(req)}`
      : `user:${userId}`;

    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + opts.windowMs };
      buckets.set(key, bucket);
    }
    bucket.count++;

    const remaining = Math.max(0, opts.max - bucket.count);
    res.setHeader('X-RateLimit-Limit', String(opts.max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));

    if (bucket.count > opts.max) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      console.warn(`[RateLimit] ${opts.name} limit hit for ${key}`);
      return res.status(429).json({ error: opts.message, retryAfterSeconds: retryAfterSec });
    }
    next();
  };
}

// Periodically drop expired counters so memory doesn't grow forever
setInterval(() => {
  const now = Date.now();
  for (const buckets of allBuckets) {
    for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
  }
}, 10 * 60 * 1000).unref();

const MIN = 60 * 1000;
const envInt = (name: string, fallback: number) => {
  const n = parseInt(process.env[name] || '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// ---- Limits used by the app (can be tuned with env vars without code changes) ----

/** Each user: AI generations (notes, quiz, chat answers, flashcards, planner, tools) */
export const aiUserLimiter = createRateLimiter({
  name: 'ai-user',
  windowMs: 10 * MIN,
  max: envInt('AI_LIMIT_PER_USER_10MIN', 40),
  message: "You're using AI features very quickly. Please wait a few minutes and try again."
});

/** Each IP: stops one person from creating many guest accounts to bypass the per-user limit */
export const aiIpLimiter = createRateLimiter({
  name: 'ai-ip',
  windowMs: 10 * MIN,
  max: envInt('AI_LIMIT_PER_IP_10MIN', 80),
  keyBy: 'ip',
  message: 'Too many AI requests from your network. Please wait a few minutes and try again.'
});

/** Whole site: protects the shared AI key's daily quota */
export const aiGlobalDailyLimiter = createRateLimiter({
  name: 'ai-global-daily',
  windowMs: 24 * 60 * MIN,
  max: envInt('AI_LIMIT_GLOBAL_PER_DAY', 1000),
  keyBy: 'global',
  message: 'StudyMate has reached its AI usage limit for today. Please try again tomorrow.'
});

/** Each user: document uploads */
export const uploadLimiter = createRateLimiter({
  name: 'upload',
  windowMs: 60 * MIN,
  max: envInt('UPLOAD_LIMIT_PER_USER_HOUR', 20),
  message: 'Upload limit reached. Please try again in a while.'
});

/** Each IP: new guest workspaces */
export const guestLimiter = createRateLimiter({
  name: 'guest',
  windowMs: 60 * MIN,
  max: 20,
  keyBy: 'ip',
  message: 'Too many new sessions from your network. Please try again later.'
});

/** Each IP: login / signup attempts (slows down password guessing) */
export const authLimiter = createRateLimiter({
  name: 'auth',
  windowMs: 15 * MIN,
  max: 20,
  keyBy: 'ip',
  message: 'Too many login attempts. Please wait 15 minutes and try again.'
});

/** All three AI limits together, applied to every route that calls the AI model */
export const aiLimiters = [aiIpLimiter, aiUserLimiter, aiGlobalDailyLimiter];
