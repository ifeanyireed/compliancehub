import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Determine environment namespace: prod, staging, or dev
const getEnvNamespace = (): string => {
  const env = (
    process.env.NEXT_PUBLIC_APP_ENV ||
    process.env.APP_ENV ||
    process.env.NODE_ENV ||
    "prod"
  ).toLowerCase();

  if (env.includes("dev")) return "dev";
  if (env.includes("stag")) return "staging";
  return "prod";
};

// Singleton client instances
let redisInstance: Redis | null = null;
let isRedisConfigured = false;

// Initialize Upstash Redis client with resilient error handling
export function getRedisClient(): Redis | null {
  if (redisInstance) {
    return redisInstance;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    redisInstance = new Redis({
      url,
      token,
      retry: {
        retries: 2,
        backoff: (retryCount) => Math.exp(retryCount) * 50,
      },
    });
    isRedisConfigured = true;
    return redisInstance;
  } catch (err) {
    console.warn("⚠️ Failed to initialize Upstash Redis client:", err);
    return null;
  }
}

/**
 * Standard deterministic Redis key generator across ComplianceHub.ng:
 * chub:{environment}:{subsystem}:{scope}:{resource}:{identifier}
 */
export function buildRedisKey(
  subsystem: "shared" | "auth" | "business" | "experts" | "agents" | "enterprise" | "admin" | "staff" | "lock",
  scope: string, // "global" or `tenant_${uuid}`
  resource: string, // e.g. "frameworks", "score", "calendar", "perms", "profile", "ratelimit", "idempotency"
  identifier?: string // e.g. entity id, slug, date, or client IP
): string {
  const env = getEnvNamespace();
  const parts = ["chub", env, subsystem, scope, resource];
  if (identifier) {
    parts.push(identifier);
  }
  return parts.join(":");
}

export function getTenantKey(
  subsystem: "business" | "agents" | "enterprise" | "auth",
  tenantId: string,
  resource: string,
  identifier?: string
): string {
  return buildRedisKey(subsystem, `tenant_${tenantId}`, resource, identifier);
}

export function getGlobalKey(
  subsystem: "shared" | "auth" | "experts" | "admin" | "staff" | "lock",
  resource: string,
  identifier?: string
): string {
  return buildRedisKey(subsystem, "global", resource, identifier);
}

// ==========================================
// Cache Aside Helpers (Fail-Open)
// ==========================================

export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const data = await redis.get<T>(key);
    return data ?? null;
  } catch (err) {
    console.warn(`[Redis Cache Miss/Error] Key ${key}:`, err);
    return null; // Fail-open to source of truth
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = 900 // Default 15 minutes
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    // Add jitter (±10%) to prevent simultaneous expiration stampedes
    const jitter = Math.floor(ttlSeconds * (Math.random() * 0.2 - 0.1));
    const finalTTL = Math.max(10, ttlSeconds + jitter);
    await redis.set(key, value, { ex: finalTTL });
  } catch (err) {
    console.warn(`[Redis Cache Set Error] Key ${key}:`, err);
  }
}

export async function deleteCached(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (err) {
    console.warn(`[Redis Cache Del Error] Key ${key}:`, err);
  }
}

export async function deletePattern(pattern: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    let cursor = 0;
    do {
      const res = await redis.scan(cursor, { match: pattern, count: 50 });
      cursor = typeof res[0] === "number" ? res[0] : parseInt(res[0], 10);
      const keys = res[1];
      if (keys && keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== 0);
  } catch (err) {
    console.warn(`[Redis Scan & Del Error] Pattern ${pattern}:`, err);
  }
}

export async function deleteTenantCache(
  tenantId: string,
  subsystem: "business" | "agents" | "enterprise" = "business"
): Promise<void> {
  const pattern = buildRedisKey(subsystem, `tenant_${tenantId}`, "*");
  await deletePattern(pattern);
}

// ==========================================
// Distributed Rate Limiting with Fallback
// ==========================================

// In-memory fallback map for environments without Upstash credentials or during Redis outages
interface MemoryRateRecord {
  timestamps: number[];
}
const memoryRateMap = new Map<string, MemoryRateRecord>();

function checkMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const record = memoryRateMap.get(key) || { timestamps: [] };
  const cutoff = now - windowMs;

  record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const reset = Math.ceil((oldest + windowMs - now) / 1000);
    return { success: false, limit, remaining: 0, reset: Math.max(1, reset) };
  }

  record.timestamps.push(now);
  memoryRateMap.set(key, record);

  return {
    success: true,
    limit,
    remaining: limit - record.timestamps.length,
    reset: Math.ceil(windowMs / 1000),
  };
}

// Rate Limiter instances
let authLimiter: Ratelimit | null = null;
let publicLimiter: Ratelimit | null = null;
let generalLimiter: Ratelimit | null = null;

function getLimiter(tier: "auth" | "public" | "general"): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const env = getEnvNamespace();
    if (tier === "auth") {
      if (!authLimiter) {
        authLimiter = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(10, "1 m"),
          prefix: `chub:${env}:auth:global:ratelimit:auth`,
        });
      }
      return authLimiter;
    }

    if (tier === "public") {
      if (!publicLimiter) {
        publicLimiter = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(15, "1 m"),
          prefix: `chub:${env}:auth:global:ratelimit:public`,
        });
      }
      return publicLimiter;
    }

    if (!generalLimiter) {
      generalLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(120, "1 m"),
        prefix: `chub:${env}:auth:global:ratelimit:api`,
      });
    }
    return generalLimiter;
  } catch (err) {
    console.warn("Failed to initialize Upstash ratelimit:", err);
    return null;
  }
}

export async function rateLimitCheck(
  tier: "auth" | "public" | "general",
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const limiter = getLimiter(tier);

  if (limiter) {
    try {
      const result = await limiter.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: Math.ceil((result.reset - Date.now()) / 1000),
      };
    } catch (err) {
      console.warn(`Upstash rate limiting error for tier ${tier}, falling back to memory:`, err);
    }
  }

  // Graceful in-memory fallback
  const tierConfigs = {
    auth: { limit: 10, windowMs: 60 * 1000 },
    public: { limit: 15, windowMs: 60 * 1000 },
    general: { limit: 120, windowMs: 60 * 1000 },
  };
  const config = tierConfigs[tier];
  return checkMemoryRateLimit(`${tier}:${identifier}`, config.limit, config.windowMs);
}

// ==========================================
// Operational Data, Locks & Idempotency
// ==========================================

export async function acquireLock(
  lockKey: string,
  ttlSeconds: number = 30
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return true; // Fail-open if Redis is not configured

  try {
    const res = await redis.set(lockKey, "LOCKED", { nx: true, ex: ttlSeconds });
    return res === "OK";
  } catch (err) {
    console.warn(`[Redis Lock Error] Key ${lockKey}:`, err);
    return true; // Fail-open to avoid halting operations
  }
}

export async function releaseLock(lockKey: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(lockKey);
  } catch (err) {
    console.warn(`[Redis Lock Release Error] Key ${lockKey}:`, err);
  }
}

export async function acquireWebhookIdempotency(
  eventId: string,
  ttlSeconds: number = 86400 // 24 hours
): Promise<boolean> {
  const key = getGlobalKey("lock", "idempotency", eventId);
  return acquireLock(key, ttlSeconds);
}

export async function bufferBlogView(postIdOrSlug: string): Promise<number | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const key = getGlobalKey("shared", "blog", "views");
    const newCount = await redis.hincrby(key, postIdOrSlug, 1);
    return newCount;
  } catch (err) {
    console.warn(`[Redis Buffer Blog View Error]:`, err);
    return null;
  }
}

// ==========================================
// Health & Observability Check
// ==========================================

export async function checkRedisHealth(): Promise<{
  status: "connected" | "disconnected" | "unconfigured";
  latencyMs?: number;
  message?: string;
}> {
  const redis = getRedisClient();
  if (!redis) {
    return {
      status: "unconfigured",
      message: "Upstash Redis credentials not set. Running with resilient local fallback.",
    };
  }

  const start = Date.now();
  try {
    const pong = await redis.ping();
    const latencyMs = Date.now() - start;
    if (pong === "PONG" || pong) {
      return {
        status: "connected",
        latencyMs,
        message: `Upstash Redis connected (${latencyMs}ms)`,
      };
    }
    return {
      status: "disconnected",
      message: "Unexpected ping response",
    };
  } catch (err: any) {
    return {
      status: "disconnected",
      latencyMs: Date.now() - start,
      message: `Redis connection error: ${err?.message || "timeout"}`,
    };
  }
}
