// In-memory IP rate limiter. Resets when the process restarts. Fine for a single-instance
// demo; swap for Redis or Upstash if this ever runs on multiple instances.

const HITS = new Map<string, number[]>();

export function checkRateLimit(
  ip: string,
  windowMs: number,
  maxHits: number,
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const recent = (HITS.get(ip) ?? []).filter((t) => t > cutoff);
  if (recent.length >= maxHits) {
    const resetMs = recent[0] + windowMs - now;
    return { allowed: false, remaining: 0, resetMs };
  }
  recent.push(now);
  HITS.set(ip, recent);
  return { allowed: true, remaining: maxHits - recent.length, resetMs: windowMs };
}
