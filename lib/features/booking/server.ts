import { prisma } from "@/lib/db";
import { experts } from "@/lib/experts";
import {
  bandCoversSession,
  meetingAccess,
  timeOffCoversSession,
  type AvailabilityBand,
  type MeetingAccess,
  type TimeOffBlock,
} from "@/lib/expert-portal";
import {
  ALL_SLOTS,
  BOOKING_STATUS,
  HOLD_MINUTES,
  PAYMENT_STATUS,
  SESSION_MINUTES,
  slotKey,
} from "@/lib/features/booking/policy";

export type BookingRecord = Awaited<ReturnType<typeof findUserBooking>>;

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

export async function takenSlots(expertId: string, date: string): Promise<string[]> {
  const rows = await prisma.booking.findMany({
    where: { expertId, date, slotKey: { not: null } },
    select: { time: true },
  });
  return rows.map((row) => row.time);
}

/**
 * The hours a practitioner works, and any time off covering one date.
 *
 * The bands are the practitioner's *whole* week, not just the weekday asked
 * about — `slotIsOffered` needs to tell "has set no hours at all" apart from
 * "does not work Sundays", and a query narrowed to one weekday cannot. It is at
 * most a couple of dozen rows.
 *
 * Loaded once per question and handed to `slotIsOffered`, so a whole day of
 * slots costs two queries rather than two per slot.
 */
export type WorkingRules = { bands: AvailabilityBand[]; timeOff: TimeOffBlock[] };

export async function workingRules(expertId: string, date: string): Promise<WorkingRules> {
  const [bands, timeOff] = await Promise.all([
    prisma.availabilityRule.findMany({
      where: { expertId },
      select: { weekday: true, start: true, end: true },
    }),
    prisma.timeOff.findMany({
      where: { expertId, startDate: { lte: date }, endDate: { gte: date } },
      select: { startDate: true, endDate: true, allDay: true, startTime: true, endTime: true },
    }),
  ]);
  return { bands, timeOff };
}

/**
 * Whether the practitioner is open for business at this exact time.
 *
 * Two rules, in order:
 *  - the *whole* session has to fit inside one of the day's bands, so 12:30 is
 *    not offered against hours that finish at 13:00;
 *  - no block of time off may overlap it.
 *
 * A practitioner who has never set hours keeps the clinic default — every slot
 * on the board. Reading "unset" as "unavailable" would silently empty the
 * calendar of everyone who has not opened the portal yet, which is a worse
 * failure than the one this function exists to fix.
 */
export function slotIsOffered(rules: WorkingRules, date: string, time: string): boolean {
  const session = { date, time };
  if (rules.bands.length && !bandCoversSession(rules.bands, session, SESSION_MINUTES)) {
    return false;
  }
  return !rules.timeOff.some((block) => timeOffCoversSession(block, session, SESSION_MINUTES));
}

/** The single-slot form, for the write paths. */
export async function offersSlot(expertId: string, date: string, time: string): Promise<boolean> {
  return slotIsOffered(await workingRules(expertId, date), date, time);
}

/**
 * What a visitor may book on one date.
 *
 * A slot is available when nobody holds it *and* the practitioner works then.
 * Both halves matter: the taken-check keeps two clients apart, and the rules
 * check keeps the calendar inside the hours the practitioner agreed to — the
 * same rows the expert portal writes, read back here so what we sell and what
 * they set cannot drift apart.
 */
export async function dayAvailability(expertId: string, date: string) {
  await releaseExpiredHolds();
  const [taken, rules] = await Promise.all([
    takenSlots(expertId, date),
    workingRules(expertId, date),
  ]);
  const held = new Set(taken);
  return ALL_SLOTS.map((time) => ({
    time,
    available: !held.has(time) && slotIsOffered(rules, date, time),
  }));
}

export async function findUserBooking(
  id: string,
  session: { sub: string; role: string }
) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { payment: true },
  });
  if (!booking) return null;
  if (booking.userId !== session.sub && session.role !== "ADMIN") return null;
  return booking;
}

export function makeRef(): string {
  const alphabet = "ACDEFGHJKLMNPQRTUVWXY3456789";
  let output = "";
  for (let index = 0; index < 6; index++) {
    output += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `EM-${output}`;
}

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
    } catch (error) {
      if (isUniqueViolation(error, "ref")) continue;
      throw error;
    }
  }
  throw new Error("could not allocate a booking reference");
}

export function isUniqueViolation(error: unknown, field?: string): boolean {
  const prismaError = error as {
    code?: string;
    meta?: { target?: string[] | string };
  };
  if (prismaError?.code !== "P2002") return false;
  if (!field) return true;
  const target = prismaError.meta?.target;
  const fields = Array.isArray(target)
    ? target
    : typeof target === "string"
      ? [target]
      : [];
  return fields.some((targetField) =>
    targetField.toLowerCase().includes(field.toLowerCase())
  );
}

export function expertById(id: string) {
  return experts.find((expert) => expert.id === id) ?? null;
}

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
  meetingUrl: string | null;
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

export function serializeBooking(booking: BookingWithPayment, now: Date = new Date()) {
  return {
    id: booking.id,
    ref: booking.ref,
    concern: booking.concern,
    expertId: booking.expertId,
    expertName: booking.expertName,
    date: booking.date,
    time: booking.time,
    amount: booking.amount,
    status: booking.status,
    // The room is gated on the clock, not on the page. The URL only enters the
    // response once the door is actually open, so reading this API early tells
    // you exactly what reading the screen early tells you — nothing.
    meeting: booking.status === BOOKING_STATUS.confirmed
      ? (meetingAccess(
          {
            date: booking.date,
            time: booking.time,
            status: booking.status,
            meetingUrl: booking.meetingUrl,
          },
          SESSION_MINUTES,
          now
        ) as MeetingAccess)
      : null,
    holdExpiresAt: booking.holdExpiresAt?.toISOString() ?? null,
    rescheduleCount: booking.rescheduleCount,
    previousDate: booking.previousDate,
    previousTime: booking.previousTime,
    cancelledAt: booking.cancelledAt?.toISOString() ?? null,
    createdAt: booking.createdAt.toISOString(),
    payment: booking.payment
      ? {
          status: booking.payment.status,
          method: booking.payment.method,
          cardBrand: booking.payment.cardBrand,
          last4: booking.payment.last4,
          vpaMasked: booking.payment.vpaMasked,
          reference: booking.payment.reference,
          failureCode: booking.payment.failureCode,
          failureMessage: booking.payment.failureMessage,
          attempts: booking.payment.attempts,
          refundAmount: booking.payment.refundAmount,
          refundedAt: booking.payment.refundedAt?.toISOString() ?? null,
        }
      : null,
  };
}

export type SerializedBooking = ReturnType<typeof serializeBooking>;