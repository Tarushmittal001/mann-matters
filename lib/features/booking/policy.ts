/**
 * Every rule about when a session may be booked, moved, cancelled, or refunded
 * lives here, shared by browser and server callers.
 */

import { timeSlots } from "@/lib/experts";

export const IST_OFFSET = "+05:30";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export const HOLD_MINUTES = 15;

/**
 * How long a request waits on a practitioner before the slot goes back on the
 * board. Longer than a payment hold because there is a person at the other end
 * of it, not a card form — but not open-ended, or an unanswered request quietly
 * blocks a slot nobody can book.
 */
export const REQUEST_HOURS = 24;

/**
 * When a request lapses: `REQUEST_HOURS` from now, or two hours before the
 * session, whichever comes first. A request for tomorrow morning cannot sit
 * for a full day — it would still be "pending" after the session had started.
 */
export function requestExpiry(date: string, time: string, now: Date = new Date()): Date {
  const window = new Date(now.getTime() + REQUEST_HOURS * 3_600_000);
  const shortly = new Date(sessionStart(date, time).getTime() - 2 * 3_600_000);
  return shortly < window ? shortly : window;
}
export const FREE_CHANGE_HOURS = 24;
export const MAX_RESCHEDULES = 2;
export const HORIZON_DAYS = 14;
export const SESSION_MINUTES = 50;

export const BOOKING_STATUS = {
  /**
   * Asked for, not yet agreed to. The client has chosen a slot and the slot is
   * held for them, but nothing has been charged and the practitioner has not
   * said yes. This is where every new booking starts.
   */
  requested: "REQUESTED",
  /** The practitioner said no. The slot is released; nothing was ever taken. */
  declined: "DECLINED",
  pendingPayment: "PENDING_PAYMENT",
  confirmed: "CONFIRMED",
  cancelled: "CANCELLED",
  expired: "EXPIRED",
  // written by the practitioner when they close a session out. These were
  // missing here while the expert portal was already setting them, so anything
  // reading this list fell through to its "unknown" branch.
  completed: "COMPLETED",
  noShow: "NO_SHOW",
} as const;

export const PAYMENT_STATUS = {
  pending: "PENDING",
  paid: "PAID",
  failed: "FAILED",
  refunded: "REFUNDED",
  // the free first session: nothing was ever owed, so nothing is pending
  waived: "WAIVED",
} as const;

export const ALL_SLOTS: string[] = timeSlots.flatMap((group) => group.slots);
const SLOT_SET = new Set(ALL_SLOTS);

export function isKnownSlot(time: string): boolean {
  return SLOT_SET.has(time);
}

/**
 * "YYYY-MM-DD" that names a real calendar day. A pattern check alone lets
 * "2026-11-31" through, which JavaScript quietly reads as 1 December: the slot
 * key differs from "2026-12-01" while the hour is the same, so one real hour
 * could be sold twice, and time off filed by string range is stepped round.
 */
export function isCalendarDate(raw: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  const d = new Date(`${raw}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === raw;
}

export function sessionStart(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${IST_OFFSET}`);
}

export function todayIST(now: Date = new Date()): string {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function istDateOffset(days: number, now: Date = new Date()): string {
  return new Date(now.getTime() + IST_OFFSET_MS + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

export function bookableRange(now: Date = new Date()) {
  return { first: istDateOffset(1, now), last: istDateOffset(HORIZON_DAYS, now) };
}

export function hoursUntil(date: string, time: string, now: Date = new Date()): number {
  return (sessionStart(date, time).getTime() - now.getTime()) / 3_600_000;
}

export function slotKey(expertId: string, date: string, time: string): string {
  return `${expertId}|${date}|${time}`;
}

export function holdsSlot(
  status: string,
  holdExpiresAt: Date | null,
  now: Date = new Date()
): boolean {
  if (status === BOOKING_STATUS.confirmed) return true;
  if (status !== BOOKING_STATUS.pendingPayment) return false;
  return !!holdExpiresAt && holdExpiresAt.getTime() > now.getTime();
}

export type Decision = { ok: true } | { ok: false; reason: string; code: string };

const ok: Decision = { ok: true };
const no = (code: string, reason: string): Decision => ({ ok: false, code, reason });

export function validateSlot(
  date: string,
  time: string,
  now: Date = new Date()
): Decision {
  if (!isCalendarDate(date)) return no("BAD_DATE", "Please choose a date.");
  if (!isKnownSlot(time)) return no("BAD_TIME", "Please choose one of the available times.");

  const { first, last } = bookableRange(now);
  if (date < first) {
    return no("PAST_DATE", "Sessions start from tomorrow — please pick a later date.");
  }
  if (date > last) {
    return no(
      "BEYOND_HORIZON",
      `We open bookings ${HORIZON_DAYS} days ahead. Please pick an earlier date.`
    );
  }
  if (sessionStart(date, time).getTime() <= now.getTime()) {
    return no("PAST_TIME", "That time has already passed. Please pick another.");
  }
  return ok;
}

export type BookingLike = {
  status: string;
  date: string;
  time: string;
  rescheduleCount: number;
};

export function canCancel(booking: BookingLike, now: Date = new Date()): Decision {
  if (booking.status === BOOKING_STATUS.cancelled) {
    return no("ALREADY_CANCELLED", "This session is already cancelled.");
  }
  if (booking.status === BOOKING_STATUS.expired) {
    return no("EXPIRED", "This booking expired before it was paid for.");
  }
  if (hoursUntil(booking.date, booking.time, now) <= 0) {
    return no("SESSION_PASSED", "This session has already taken place.");
  }
  return ok;
}

export function canReschedule(booking: BookingLike, now: Date = new Date()): Decision {
  if (booking.status !== BOOKING_STATUS.confirmed) {
    return no(
      "NOT_CONFIRMED",
      "Only a confirmed session can be moved. Complete payment first."
    );
  }
  if (booking.rescheduleCount >= MAX_RESCHEDULES) {
    return no(
      "LIMIT_REACHED",
      `A session can be moved ${MAX_RESCHEDULES} times. Please cancel and book afresh, or message us and we'll sort it out.`
    );
  }
  const hours = hoursUntil(booking.date, booking.time, now);
  if (hours <= 0) return no("SESSION_PASSED", "This session has already taken place.");
  if (hours < FREE_CHANGE_HOURS) {
    return no(
      "TOO_LATE",
      `Sessions can be moved up to ${FREE_CHANGE_HOURS} hours before they start. Your therapist has already set this time aside — message us if something urgent has come up.`
    );
  }
  return ok;
}

/**
 * What a client gets back for cancelling now.
 *
 * Pass the payment itself, not only its status: an admin may already have
 * given part of the fee back, and what is refundable is what is still held —
 * never the whole fee a second time. (A bare status is still accepted, read as
 * "nothing refunded yet".)
 */
export function refundFor(
  booking: BookingLike & { amount: number },
  payment: string | { status: string; refundAmount?: number | null } | null,
  now: Date = new Date()
): { amount: number; full: boolean; note: string } {
  const paymentStatus = typeof payment === "string" ? payment : payment?.status ?? null;
  if (paymentStatus !== PAYMENT_STATUS.paid) {
    return {
      amount: 0,
      full: false,
      note: "Nothing was charged, so there's nothing to refund.",
    };
  }
  const alreadyBack =
    typeof payment === "object" && payment ? Math.min(payment.refundAmount ?? 0, booking.amount) : 0;
  const remaining = booking.amount - alreadyBack;
  if (remaining <= 0) {
    return { amount: 0, full: false, note: "Your fee has already been refunded." };
  }
  if (hoursUntil(booking.date, booking.time, now) >= FREE_CHANGE_HOURS) {
    return alreadyBack > 0
      ? {
          amount: remaining,
          full: false,
          note: `You'll be refunded the rest of your fee, ₹${remaining} — it usually lands in 5–7 working days.`,
        }
      : {
          amount: remaining,
          full: true,
          note: "You'll be refunded in full — it usually lands in 5–7 working days.",
        };
  }
  return {
    amount: 0,
    full: false,
    note: `This is inside the ${FREE_CHANGE_HOURS}-hour window, so the session fee isn't refunded. Your therapist has already set the time aside.`,
  };
}

export const changePolicyNote = `Free to move or cancel up to ${FREE_CHANGE_HOURS} hours before your session.`;

/**
 * Whether cancelling a free session right now hands it back to the person.
 *
 * The same 24-hour line that decides refunds: early enough and the therapist's
 * hour can go to someone else, so the free session is theirs to use again;
 * inside the window, or a no-show, and it counts as used.
 */
export function proBonoReturnsOnCancel(
  booking: { date: string; time: string },
  now: Date = new Date()
): boolean {
  return hoursUntil(booking.date, booking.time, now) >= FREE_CHANGE_HOURS;
}
/**
 * What an admin may still give back on a payment, and why.
 *
 * Distinct from `refundFor`, which is the *client's* entitlement when they
 * cancel: free outside the 24-hour window, nothing inside it. This is the
 * override — a session the practitioner missed, a room that never opened, a
 * complaint worth settling. It answers only "how much is left to give back",
 * and deliberately takes no view on whether giving it back is deserved. That
 * is a judgement, and judgements belong to the person, with their reason
 * recorded next to it.
 */
export function refundableAmount(payment: {
  status: string;
  amount: number;
  refundAmount: number | null;
} | null): { max: number; alreadyBack: number; reason: string | null } {
  if (!payment) {
    return { max: 0, alreadyBack: 0, reason: "No payment was ever taken for this session." };
  }
  if (payment.status === PAYMENT_STATUS.waived) {
    return { max: 0, alreadyBack: 0, reason: "This was a free session — nothing was charged." };
  }
  if (payment.status !== PAYMENT_STATUS.paid && payment.status !== PAYMENT_STATUS.refunded) {
    return { max: 0, alreadyBack: 0, reason: "This payment never completed, so there is nothing to give back." };
  }
  const alreadyBack = Math.min(payment.refundAmount ?? 0, payment.amount);
  const max = payment.amount - alreadyBack;
  return {
    max,
    alreadyBack,
    reason: max > 0 ? null : "The whole amount has already been refunded.",
  };
}
