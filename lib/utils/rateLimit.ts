type Entry = { tokens: number; last: number };
const BUCKET = new Map<string, Entry>();

/**
 * Simple in-memory rate limiter per key (e.g., IP).
 * @param key unique key per client
 * @param capacity number of tokens
 * @param refillPerSec tokens refilled per second
 */
export function takeToken(key: string, capacity = 10, refillPerSec = 1): boolean {
  const now = Date.now();
  const e = BUCKET.get(key) || { tokens: capacity, last: now };
  const delta = (now - e.last) / 1000;
  e.tokens = Math.min(capacity, e.tokens + delta * refillPerSec);
  e.last = now;
  if (e.tokens < 1) {
    BUCKET.set(key, e);
    return false;
  }
  e.tokens -= 1;
  BUCKET.set(key, e);
  return true;
}
