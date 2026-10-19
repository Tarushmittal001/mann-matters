import { prisma } from "@/lib/db";
import type { Session } from "@/lib/auth";

/**
 * What an admin did, written down.
 *
 * The admin screens can revoke a practitioner's login, hide or delete a
 * listing, change a discount code and read any client's receipt. With one
 * trusted admin, none of that needed recording. With two, "who hid Dr. Shah's
 * listing?" has to have an answer, and a question nobody can answer is how a
 * small team ends up distrusting each other over a mistake.
 *
 * ── WHAT GOES IN, AND WHAT NEVER DOES ───────────────────────────────────────
 * Only administrative acts: who, what, which thing, one readable line. Never
 * clinical content. A session note, an intake answer or the body of a piece of
 * feedback must not be copied into an audit row — this table is read by people
 * who are not the client's practitioner, which is exactly the boundary the
 * rest of the codebase is built to hold.
 *
 * ── WHY IT CANNOT THROW ─────────────────────────────────────────────────────
 * `record()` swallows its own failures. A listing that saved correctly must
 * not report failure because the log was unavailable — the action already
 * happened, and telling the admin it failed would have them do it twice. The
 * failure goes to the server console instead, where it is a bug to fix rather
 * than a lie to the person at the keyboard.
 *
 * That is a deliberate trade: this is an operational trail, not an immutable
 * ledger. If it ever has to be evidence, it needs to move somewhere append-only
 * that the application cannot delete from.
 */

export type AuditAction =
  | "expert.create"
  | "expert.update"
  | "expert.delete"
  | "expert.hide"
  | "expert.show"
  | "expert.photo"
  | "expert.access.invite"
  | "expert.access.revoke"
  | "expert.notes-policy"
  | "coupon.create"
  | "coupon.update"
  | "coupon.delete"
  | "feedback.approve"
  | "feedback.hide"
  | "client.block"
  | "client.unblock"
  | "payout.mark"
  | "payout.undo"
  | "payment.refund";

export async function record(
  session: Session,
  action: AuditAction,
  subject: { type: string; id: string },
  summary: string,
  meta: Record<string, unknown> = {}
): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        actorId: session.sub,
        actorEmail: session.email,
        actorRole: session.role,
        action,
        subject: subject.type,
        subjectId: subject.id,
        summary: summary.slice(0, 500),
        meta: JSON.stringify(meta).slice(0, 2000),
      },
    });
  } catch (err) {
    // the action succeeded; only the record of it did not
    console.error("[audit] could not record", action, err);
  }
}

/** The most recent events, newest first — for the admin trail screen. */
export async function recentEvents(limit = 200) {
  return prisma.auditEvent.findMany({ orderBy: { at: "desc" }, take: limit });
}

/** Human wording for an action key, so the screen is not a list of dot-strings. */
export const ACTION_LABEL: Record<string, string> = {
  "expert.create": "Added a therapist",
  "expert.update": "Edited a therapist",
  "expert.delete": "Deleted a listing",
  "expert.hide": "Hid a listing",
  "expert.show": "Listed a therapist",
  "expert.photo": "Uploaded a portrait",
  "expert.access.invite": "Sent a login invite",
  "expert.access.revoke": "Removed a login",
  "coupon.create": "Created a code",
  "coupon.update": "Changed a code",
  "coupon.delete": "Deleted a code",
  "feedback.approve": "Published feedback",
  "feedback.hide": "Hid feedback",
  "client.block": "Blocked a client",
  "client.unblock": "Restored a client",
  "payout.mark": "Marked a payout sent",
  "payout.undo": "Undid a payout record",
  "payment.refund": "Refunded a payment",
};

/** Actions that take something away, so the screen can mark them. */
export const DESTRUCTIVE = new Set<string>([
  "expert.delete",
  "expert.access.revoke",
  "coupon.delete",
  "expert.hide",
  "feedback.hide",
  "client.block",
  "payout.undo",
  "payment.refund",
]);
