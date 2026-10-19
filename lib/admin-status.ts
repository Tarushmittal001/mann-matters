import { BOOKING_STATUS, PAYMENT_STATUS } from "@/lib/features/booking/policy";

/**
 * How a status reads and how it looks, in one place.
 *
 * The admin screens were each inventing their own wording for the same stored
 * string, which is how "PENDING" ends up being called "awaited" on one page
 * and "unpaid" on the next while meaning the same row in the same table.
 */

export type Tone = "good" | "wait" | "bad" | "mute";

export const TONE_CLASS: Record<Tone, string> = {
  good: "bg-sage-light/70 text-forest-800",
  wait: "bg-gold/25 text-gold-dark",
  bad: "bg-red-100 text-red-800",
  mute: "bg-forest-800/[0.06] text-ink/70",
};

export const PAYMENT_LABEL: Record<string, { label: string; tone: Tone }> = {
  [PAYMENT_STATUS.paid]: { label: "Confirmed", tone: "good" },
  [PAYMENT_STATUS.pending]: { label: "Awaited", tone: "wait" },
  [PAYMENT_STATUS.failed]: { label: "Failed", tone: "bad" },
  [PAYMENT_STATUS.refunded]: { label: "Refunded", tone: "mute" },
  [PAYMENT_STATUS.waived]: { label: "Free session", tone: "mute" },
};

export const BOOKING_LABEL: Record<string, { label: string; tone: Tone }> = {
  [BOOKING_STATUS.confirmed]: { label: "Confirmed", tone: "good" },
  [BOOKING_STATUS.completed]: { label: "Completed", tone: "good" },
  [BOOKING_STATUS.pendingPayment]: { label: "Awaiting payment", tone: "wait" },
  [BOOKING_STATUS.cancelled]: { label: "Cancelled", tone: "mute" },
  [BOOKING_STATUS.expired]: { label: "Expired", tone: "mute" },
  [BOOKING_STATUS.noShow]: { label: "No-show", tone: "bad" },
};

/** An unknown string is shown as itself rather than swallowed — a status we
    stopped recognising is a bug worth seeing, not one worth hiding. */
export const describe = (map: Record<string, { label: string; tone: Tone }>, status: string) =>
  map[status] ?? { label: status, tone: "mute" as Tone };
