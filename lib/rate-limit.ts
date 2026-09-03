/**
 * A small in-memory sliding-window limiter for the endpoints that guess-attacks
 * and card-testing target: login, signup, resend, and payment.
 *
 * Scope: one server instance. On multi-instance hosting this becomes per-node
 * rather than global — good enough to blunt scripted abuse, not a substitute for
 * an edge/WAF limiter or a Redis-backed counter in production.
 */

type Hit = { count: number; resetAt: number };

const buckets = new Map<string, Hit>();

// keep the map from growing without bound on a long-lived server
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  // forEach rather than for..of: the project's tsconfig has no `target`, so
  // direct Map iteration would need downlevelIteration
  buckets.forEach((hit, key) => {
    if (hit.resetAt <= now) buckets.delete(key);
  });
}

export type Limit = { limit: number; windowMs: number };

export const LIMITS = {
  login: { limit: 8, windowMs: 10 * 60_000 },
  otpRequest: { limit: 5, windowMs: 10 * 60_000 },
  otpVerify: { limit: 10, windowMs: 10 * 60_000 },
  signup: { limit: 5, windowMs: 60 * 60_000 },
  resend: { limit: 4, windowMs: 60 * 60_000 },
  verify: { limit: 12, windowMs: 10 * 60_000 },
  payment: { limit: 10, windowMs: 10 * 60_000 },
  booking: { limit: 20, windowMs: 10 * 60_000 },
  password: { limit: 6, windowMs: 60 * 60_000 },
  enquiry: { limit: 5, windowMs: 60 * 60_000 },
  manu: { limit: 20, windowMs: 10 * 60_000 },
} satisfies Record<string, Limit>;

export type LimitName = keyof typeof LIMITS;

export type LimitResult = { ok: true } | { ok: false; retryAfter: number };

/**
 * `identifier` should be an IP, or an IP scoped by something stable but
 * non-identifying. Never pass a raw email — hash it if you must scope by account.
 */
export function rateLimit(name: LimitName, identifier: string): LimitResult {
  const { limit, windowMs } = LIMITS[name];
  const now = Date.now();
  sweep(now);

  const key = `${name}:${identifier}`;
  const hit = buckets.get(key);

  if (!hit || hit.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  hit.count += 1;
  if (hit.count > limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((hit.resetAt - now) / 1000)) };
  }
  return { ok: true };
}

/** Clear a bucket after a legitimate success, so one good login resets the count. */
export function resetLimit(name: LimitName, identifier: string) {
  buckets.delete(`${name}:${identifier}`);
}
