import { createHash } from "node:crypto";

const DAILY_LIMIT = Number(process.env["VENT_DAILY_LIMIT"] ?? 30);
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;

type CacheEntry = { value: unknown; expiresAt: number };

const callCounts = new Map<string, { day: string; count: number }>();
const responseCache = new Map<string, CacheEntry>();

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

export function ventClientId(req: { ip?: string; headers: Record<string, unknown> }): string {
  const headerId = req.headers["x-lumen-device-id"];
  if (typeof headerId === "string" && headerId.length > 0) return headerId.slice(0, 64);
  return req.ip ?? "anon";
}

export function checkAndIncrementQuota(clientId: string): {
  allowed: boolean;
  remaining: number;
  limit: number;
} {
  const day = todayKey();
  const existing = callCounts.get(clientId);
  const current = existing && existing.day === day ? existing.count : 0;
  if (current >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0, limit: DAILY_LIMIT };
  }
  callCounts.set(clientId, { day, count: current + 1 });
  return { allowed: true, remaining: DAILY_LIMIT - current - 1, limit: DAILY_LIMIT };
}

export function decrementQuota(clientId: string): void {
  const day = todayKey();
  const existing = callCounts.get(clientId);
  if (existing && existing.day === day && existing.count > 0) {
    callCounts.set(clientId, { day, count: existing.count - 1 });
  }
}

export function cacheKey(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function getCached<T>(key: string): T | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    responseCache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function putCached(key: string, value: unknown): void {
  responseCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  if (responseCache.size > 5000) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey) responseCache.delete(firstKey);
  }
}
