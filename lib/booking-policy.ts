/**
 * Every rule about when a session may be booked, moved, cancelled, or refunded
 * lives here — so the booking form, the reschedule dialog, the dashboard copy,
 * and the route handlers can never quietly disagree with each other.
 *
 * All session times are Asia/Kolkata. Dates and times are stored as plain
 * strings (`YYYY-MM-DD`, `HH:mm`) and only converted to absolute instants here,
 * with the IST offset applied explicitly — so the server's own timezone,
 * whatever a host gives us, never changes the answer.
 */

import { timeSlots } from "@/lib/experts";

export const IST_OFFSET = "+05:30";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** An unpaid booking holds its slot for this long, then the slot returns to the pool. */
export const HOLD_MINUTES = 15;
/** Move or cancel freely until this many hours before the session. */
export const FREE_CHANGE_HOURS = 24;
/** A session can be moved at most this many times. */
export const MAX_RESCHEDULES = 2;
/** How far ahead the calendar opens. */
export const HORIZON_DAYS = 14;
export const SESSION_MINUTES = 50;

export const BOOKING_STATUS = {
  pendingPayment: "PENDING_PAYMENT",
  confirmed: "CONFIRMED",
  cancelled: "CANCELLED",
  expired: "EXPIRED",
} as const;

export const PAYMENT_STATUS = {
  pending: "PENDING",
  paid: "PAID",
  failed: "FAILED",
  refunded: "REFUNDED",
} as const;

export const ALL_SLOTS: string[] = timeSlots.flatMap((g) => g.slots);
const SLOT_SET = new Set(ALL_SLOTS);

export function isKnownSlot(time: string): boolean {
  return SLOT_SET.has(time);
}

/* ------------------------------------------------------------------ *
 * IST-anchored time
 * ------------------------------------------------------------------ */

/** Absolute instant a session starts, given IST wall-clock strings. */
export function sessionStart(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${IST_OFFSET}`);
}

/** Today's date in IST, as `YYYY-MM-DD` — not the server's local date. */
export function todayIST(now: Date = new Date()): string {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** `YYYY-MM-DD` for `offset` days from today, in IST. */
export function istDateOffset(days: number, now: Date = new Date()): string {
  return new Date(now.getTime() + IST_OFFSET_MS + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/** The window the calendar offers: tomorrow through `HORIZON_DAYS` out. */
export function bookableRange(now: Date = new Date()) {
  return { first: istDateOffset(1, now), last: istDateOffset(HORIZON_DAYS, now) };
}

export function hoursUntil(date: string, time: string, now: Date = new Date()): number {
  return (sessionStart(date, time).getTime() - now.getTime()) / 3_600_000;
}

/* ------------------------------------------------------------------ *
 * Slot identity
 * ------------------------------------------------------------------ */

/**
 * The value written to `Booking.slotKey`, which carries a UNIQUE constraint.
 * Holding this key *is* holding the slot; releasing it means setting it to NULL.
 * That constraint — not a read-then-write check — is what prevents double booking.
 */
export function slotKey(expertId: string, date: string, time: string): string {
  return `${expertId}|${date}|${time}`;
}

/** A booking still occupies its slot while it is confirmed, or held and unexpired. */
export function holdsSlot(
  status: string,
  holdExpiresAt: Date | null,
  now: Date = new Date()
): boolean {
  if (status === BOOKING_STATUS.confirmed) return true;
  if (status !== BOOKING_STATUS.pendingPayment) return false;
  return !!holdExpiresAt && holdExpiresAt.getTime() > now.getTime();
}

/* ------------------------------------------------------------------ *
 * What the user is allowed to do
 * ------------------------------------------------------------------ */

export type Decision = { ok: true } | { ok: false; reason: string; code: string };

const ok: Decision = { ok: true };
const no = (code: string, reason: string): Decision => ({ ok: false, code, reason });

/** Is this date+time something we can accept at all? */
export function validateSlot(
  date: string,
  time: string,
  now: Date = new Date()
): Decision {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return no("BAD_DATE", "Please choose a date.");
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

export function canCancel(b: BookingLike, now: Date = new Date()): Decision {
  if (b.status === BOOKING_STATUS.cancelled) {
    return no("ALREADY_CANCELLED", "This session is already cancelled.");
  }
  if (b.status === BOOKING_STATUS.expired) {
    return no("EXPIRED", "This booking expired before it was paid for.");
  }
  if (hoursUntil(b.date, b.time, now) <= 0) {
    return no("SESSION_PASSED", "This session has already taken place.");
  }
  return ok;
}

export function canReschedule(b: BookingLike, now: Date = new Date()): Decision {
  if (b.status !== BOOKING_STATUS.confirmed) {
    return no(
      "NOT_CONFIRMED",
      "Only a confirmed session can be moved. Complete payment first."
    );
  }
  if (b.rescheduleCount >= MAX_RESCHEDULES) {
    return no(
      "LIMIT_REACHED",
      `A session can be moved ${MAX_RESCHEDULES} times. Please cancel and book afresh, or message us and we'll sort it out.`
    );
  }
  const hours = hoursUntil(b.date, b.time, now);
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
 * Refund on cancellation. Outside the 24-hour window the session is refunded in
 * full; inside it, the therapist's time is already committed and the fee stands.
 * The user is told which applies *before* they confirm — never after.
 */
export function refundFor(
  b: BookingLike & { amount: number },
  paymentStatus: string | null,
  now: Date = new Date()
): { amount: number; full: boolean; note: string } {
  if (paymentStatus !== PAYMENT_STATUS.paid) {
    return {
      amount: 0,
      full: false,
      note: "Nothing was charged, so there's nothing to refund.",
    };
  }
  if (hoursUntil(b.date, b.time, now) >= FREE_CHANGE_HOURS) {
    return {
      amount: b.amount,
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

/** Human sentence for the "free until" promise, used in booking + dashboard copy. */
export const changePolicyNote = `Free to move or cancel up to ${FREE_CHANGE_HOURS} hours before your session.`;
