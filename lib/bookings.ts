import { prisma } from "@/lib/db";
import { experts } from "@/lib/experts";
import {
  ALL_SLOTS,
  BOOKING_STATUS,
  HOLD_MINUTES,
  PAYMENT_STATUS,
  slotKey,
} from "@/lib/booking-policy";

/**
 * Server-side booking helpers shared by the route handlers and the dashboard.
 *
 * The one invariant worth stating plainly: a slot is held by the UNIQUE
 * `Booking.slotKey`. Holding it is `slotKey = "expert|date|time"`, releasing it
 * is `slotKey = null`. Availability is *derived* from that column — never from
 * a second table that could drift out of step with it.
 */

export type BookingRecord = Awaited<ReturnType<typeof findUserBooking>>;

/**
 * Unpaid bookings hold a slot for a few minutes so nobody loses it while typing
 * card details. Once that window passes the slot has to go back to the pool.
 *
 * There is no scheduler in this app, so expiry is swept lazily — on every read
 * of availability and before every write that competes for a slot. That keeps
 * the sweep on the path that actually cares about the result.
 */
export async function releaseExpiredHolds(now: Date = new Date()): Promise<number> {
  const { count } = await prisma.booking.updateMany({
    where: {
      status: BOOKING_STATUS.pendingPayment,
      holdExpiresAt: { lt: now },
    },
    data: { status: BOOKING_STATUS.expired, slotKey: null },
  });
  return count;
}

export function holdExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + HOLD_MINUTES * 60_000);
}

/**
 * Times already spoken for on one expert's day. Anything not in here is free.
 * Callers should `releaseExpiredHolds()` first so a lapsed hold isn't counted.
 */
export async function takenSlots(expertId: string, date: string): Promise<string[]> {
  const rows = await prisma.booking.findMany({
    where: { expertId, date, slotKey: { not: null } },
    select: { time: true },
  });
  return rows.map((r) => r.time);
}

/** Availability for a whole day, in the order the UI renders it. */
export async function dayAvailability(expertId: string, date: string) {
  await releaseExpiredHolds();
  const taken = new Set(await takenSlots(expertId, date));
  return ALL_SLOTS.map((time) => ({ time, available: !taken.has(time) }));
}

/** A booking the caller is allowed to see, or null. Ownership is checked here. */
export async function findUserBooking(
  id: string,
  session: { sub: string; role: string }
) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { payment: true },
  });
  if (!booking) return null;
  // an admin may act on any booking; everyone else only on their own.
  // a mismatch is reported as "not found", never as "not yours" — that
  // difference would confirm the existence of someone else's session.
  if (booking.userId !== session.sub && session.role !== "ADMIN") return null;
  return booking;
}

export function makeRef(): string {
  // avoids 0/O and 1/I so a reference read aloud over the phone survives
  const alphabet = "ACDEFGHJKLMNPQRTUVWXY3456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `EM-${out}`;
}

/**
 * Create a booking, retrying only on a reference collision. A slot collision is
 * *not* retried — it means someone else took the time, which the caller must
 * surface to the user.
 */
export async function createBookingWithRef(data: {
  userId: string;
  concern: string;
  expertId: string;
  expertName: string;
  date: string;
  time: string;
  amount: number;
  holdExpiresAt: Date;
}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.booking.create({
        data: {
          ...data,
          ref: makeRef(),
          status: BOOKING_STATUS.pendingPayment,
          slotKey: slotKey(data.expertId, data.date, data.time),
          payment: {
            create: { amount: data.amount, status: PAYMENT_STATUS.pending },
          },
        },
        include: { payment: true },
      });
    } catch (err) {
      if (isUniqueViolation(err, "ref")) continue; // fresh reference, try again
      throw err;
    }
  }
  throw new Error("could not allocate a booking reference");
}

/** Prisma P2002, optionally narrowed to one column. */
export function isUniqueViolation(err: unknown, field?: string): boolean {
  const e = err as { code?: string; meta?: { target?: string[] | string } };
  if (e?.code !== "P2002") return false;
  if (!field) return true;
  const target = e.meta?.target;
  const list = Array.isArray(target) ? target : typeof target === "string" ? [target] : [];
  return list.some((t) => t.toLowerCase().includes(field.toLowerCase()));
}

export function expertById(id: string) {
  return experts.find((e) => e.id === id) ?? null;
}

/* ------------------------------------------------------------------ *
 * Serialization
 * ------------------------------------------------------------------ */

type BookingWithPayment = {
  id: string;
  ref: string;
  concern: string;
  expertId: string;
  expertName: string;
  date: string;
  time: string;
  amount: number;
  status: string;
  holdExpiresAt: Date | null;
  rescheduleCount: number;
  previousDate: string | null;
  previousTime: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  payment: {
    status: string;
    method: string | null;
    cardBrand: string | null;
    last4: string | null;
    vpaMasked: string | null;
    reference: string | null;
    failureCode: string | null;
    failureMessage: string | null;
    attempts: number;
    refundAmount: number | null;
    refundedAt: Date | null;
  } | null;
};

/**
 * The shape sent to the browser. An allow-list, not an omit-list: a column added
 * to the schema later is invisible here until someone deliberately adds it —
 * which is the safe direction for a table that carries health information.
 */
export function serializeBooking(b: BookingWithPayment) {
  return {
    id: b.id,
    ref: b.ref,
    concern: b.concern,
    expertId: b.expertId,
    expertName: b.expertName,
    date: b.date,
    time: b.time,
    amount: b.amount,
    status: b.status,
    holdExpiresAt: b.holdExpiresAt?.toISOString() ?? null,
    rescheduleCount: b.rescheduleCount,
    previousDate: b.previousDate,
    previousTime: b.previousTime,
    cancelledAt: b.cancelledAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
    payment: b.payment
      ? {
          status: b.payment.status,
          method: b.payment.method,
          cardBrand: b.payment.cardBrand,
          last4: b.payment.last4,
          vpaMasked: b.payment.vpaMasked,
          reference: b.payment.reference,
          failureCode: b.payment.failureCode,
          failureMessage: b.payment.failureMessage,
          attempts: b.payment.attempts,
          refundAmount: b.payment.refundAmount,
          refundedAt: b.payment.refundedAt?.toISOString() ?? null,
        }
      : null,
  };
}

export type SerializedBooking = ReturnType<typeof serializeBooking>;
