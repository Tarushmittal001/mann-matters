/**
 * A fixed-window limiter for the endpoints that guess-attacks, card-testing and
 * spam target: login, signup, codes, payment, contact forms and the like.
 *
 * Counters live in Postgres (the `RateLimit` table), so every server instance
 * shares them and a deploy or restart doesn't hand an attacker a fresh budget.
 * Each check is ONE atomic statement — two requests racing on the same key can't
 * both read the old count — which is why it's raw SQL rather than a Prisma upsert.
 *
 * If the database is unreachable the limiter fails OPEN (allows the request) and
 * logs it: every limited route needs the database anyway, so failing closed would
 * only turn a database blip into a lockout without adding any protection.
 */

import { createHmac } from "node:crypto";
import { prisma } from "@/lib/db";
import { logFailure } from "@/lib/http";

/**
 * The stored key. Identifiers are IPs, phone numbers and the like, so they are
 * HMAC'd with AUTH_SECRET before they reach the database: the table can count
 * a client without ever holding who they are. (A plain hash of an IPv4 address
 * can be reversed by trying all 4 billion; a keyed one can't without the secret.)
 */
export function limitKey(name: LimitName, identifier: string): string {
  const digest = createHmac("sha256", process.env.AUTH_SECRET ?? "")
    .update(identifier)
    .digest("hex")
    .slice(0, 32);
  return `${name}:${digest}`;
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
  // "forgot password" emails: per address and per network
  forgot: { limit: 4, windowMs: 60 * 60_000 },
  // tries at a reset link
  reset: { limit: 10, windowMs: 60 * 60_000 },
  // briefs per network; each one already needed a verified email and phone
  enquiry: { limit: 20, windowMs: 60 * 60_000 },
  // saving your own feedback: plenty for edits, not for flooding the review queue
  feedback: { limit: 10, windowMs: 60 * 60_000 },
  // sent messages per network; each one already needed a verified address
  contact: { limit: 20, windowMs: 60 * 60_000 },
  // codes go to unproven addresses. Per address is the tight one; per network is
  // looser because a whole college or office can share one IP
  contactCodeEmail: { limit: 5, windowMs: 60 * 60_000 },
  contactCodeIp: { limit: 20, windowMs: 60 * 60_000 },
  // code guesses: 5 per code, 20 per network
  contactVerify: { limit: 5, windowMs: 10 * 60_000 },
  contactVerifyIp: { limit: 20, windowMs: 10 * 60_000 },
  // SMS codes cost money per message, so tighter than email
  phoneCode: { limit: 3, windowMs: 60 * 60_000 },
  phoneCodeIp: { limit: 10, windowMs: 60 * 60_000 },
  manu: { limit: 20, windowMs: 10 * 60_000 },
  // admin portrait uploads. Generous for a real afternoon of adding listings,
  // but this route writes files to disk, so it does not get to be unbounded
  adminUpload: { limit: 60, windowMs: 10 * 60_000 },

  /** A client changing their own picture. Generous, but not a way to fill a disk. */
  avatar: { limit: 20, windowMs: 60 * 60_000 },
  // practitioner invites. Each one sends real mail to a real inbox, so this is
  // tighter than the upload limit: enough to onboard a team in one sitting,
  // not enough to use the admin screen as a mailer
  adminInvite: { limit: 20, windowMs: 60 * 60_000 },

  /** Admin refunds. Low on purpose: this one moves money out. */
  adminRefund: { limit: 20, windowMs: 60 * 60_000 },

  /** A practitioner nudging clients to rebook. Low: this reaches real inboxes. */
  followUp: { limit: 15, windowMs: 60 * 60_000 },

  /** A practitioner offering other times. Rare in normal practice. */
  reschedule: { limit: 20, windowMs: 60 * 60_000 },

  /** Issuing prescriptions. A medical-legal record, so deliberately low. */
  prescription: { limit: 30, windowMs: 60 * 60_000 },

  /** A practitioner emailing a client their practice plan. Reaches real inboxes. */
  planSend: { limit: 30, windowMs: 60 * 60_000 },
  // trying a discount code. Generous enough for typos, tight enough that
  // nobody enumerates the code book one guess at a time
  coupon: { limit: 15, windowMs: 10 * 60_000 },
} satisfies Record<string, Limit>;

export type LimitName = keyof typeof LIMITS;

export type LimitResult = { ok: true } | { ok: false; retryAfter: number };

/**
 * `identifier` should be an IP, or an IP scoped by something stable but
 * non-identifying. Never pass a raw email — hash it if you must scope by account.
 */
export async function rateLimit(name: LimitName, identifier: string): Promise<LimitResult> {
  const { limit, windowMs } = LIMITS[name];
  const now = new Date();
  const freshReset = new Date(now.getTime() + windowMs);
  const key = limitKey(name, identifier);

  try {
    // Open a new window if there is none or the old one has ended; otherwise count
    // one more hit in the current window. Insert-or-update in a single statement.
    const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, ${freshReset})
      ON CONFLICT ("key") DO UPDATE SET
        "count"   = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN ${freshReset} ELSE "RateLimit"."resetAt" END
      RETURNING "count", "resetAt"`;

    void sweep(now);

    const hit = rows[0];
    if (hit && hit.count > limit) {
      const retryAfter = Math.ceil((new Date(hit.resetAt).getTime() - now.getTime()) / 1000);
      return { ok: false, retryAfter: Math.max(1, retryAfter) };
    }
    return { ok: true };
  } catch (err) {
    logFailure("rateLimit", err);
    return { ok: true };
  }
}

/** Clear a bucket after a legitimate success, so one good login resets the count. */
export async function resetLimit(name: LimitName, identifier: string): Promise<void> {
  try {
    await prisma.rateLimit.deleteMany({ where: { key: limitKey(name, identifier) } });
  } catch (err) {
    logFailure("rateLimit.reset", err);
  }
}

// Expired rows are dead weight, never live state, so deleting them is a tidy-up,
// not a correctness step. At most once a minute per instance, off the hot path.
let lastSweep = 0;
async function sweep(now: Date) {
  if (now.getTime() - lastSweep < 60_000) return;
  lastSweep = now.getTime();
  try {
    await prisma.rateLimit.deleteMany({ where: { resetAt: { lt: now } } });
  } catch (err) {
    logFailure("rateLimit.sweep", err);
  }
}
