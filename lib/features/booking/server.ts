import { prisma } from "@/lib/db";
import { getExpert } from "@/lib/experts-store";
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
  requestExpiry,
  PAYMENT_STATUS,
  SESSION_MINUTES,
  proBonoReturnsOnCancel,
  refundFor,
  refundableAmount,
  slotKey,
} from "@/lib/features/booking/policy";
import { logFailure } from "@/lib/http";
import { refund } from "@/lib/payments";

export type BookingRecord = Awaited<ReturnType<typeof findUserBooking>>;

type CancellableBooking = {
  id: string;
  status: string;
  amount: number;
  date: string;
  time: string;
  rescheduleCount: number;
  proBono: boolean;
  payment: { status: string; amount: number; refundAmount: number | null; reference: string | null } | null;
};

export type CancelOutcome =
  | {
      ok: true;
      booking: NonNullable<BookingRecord>;
      /** Rupees given back by this cancellation (0 when none was due). */
      refunded: number;
      full: boolean;
      note: string;
      /** The gateway refused: the booking is cancelled, the money still has to go back by hand. */
      refundPending: boolean;
      proBonoReturned: boolean;
    }
  | { ok: false; code: "ALREADY_CHANGED" };

/**
 * Cancel a booking: release its slot, and give back what is owed. The one
 * path every cancellation takes — client, admin for a client, or practitioner.
 *
 *   refund: "policy"  the client's own cancellation: in full with 24 hours'
 *                     notice, nothing inside the window (refundFor).
 *   refund: "full"    the practitioner cancelled: whatever is still held goes
 *                     back, whatever the clock says. The client did nothing
 *                     wrong, and a refunded session pays the practitioner
 *                     nothing (paysPractitioner), so cancelling can never earn.
 *
 * CLAIM, THEN MONEY. The booking moves only if it is still in the state it was
 * read in, and the refund is written only if the payment still says what it
 * said — both in one transaction. Two clicks, or a client and an admin at once,
 * therefore cancel once and refund once; the loser gets ALREADY_CHANGED. The
 * gateway is called after the claim commits. If it refuses, the refund record
 * is put back and `refundPending` says so, so the books never claim money
 * moved when it did not.
 */
export async function cancelBooking(args: {
  booking: CancellableBooking;
  by: "USER" | "ADMIN" | "EXPERT";
  refund: "policy" | "full";
  reason?: string | null;
  now?: Date;
}): Promise<CancelOutcome> {
  const { booking, by, now = new Date() } = args;
  const payment = booking.payment;

  const due =
    args.refund === "policy"
      ? refundFor(booking, payment, now)
      : (() => {
          const { max } = refundableAmount(payment);
          return {
            amount: max,
            full: max > 0,
            note: max > 0 ? "You'll be refunded in full — it usually lands in 5–7 working days." : "",
          };
        })();
  // the practitioner cancelling never costs the client their free session
  const proBonoReturned = booking.proBono && (args.refund === "full" || proBonoReturnsOnCancel(booking, now));

  const alreadyBack = payment ? Math.min(payment.refundAmount ?? 0, payment.amount) : 0;
  const totalBack = alreadyBack + due.amount;

  class Conflict extends Error {}
  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.booking.updateMany({
        where: { id: booking.id, status: booking.status },
        data: {
          status: BOOKING_STATUS.cancelled,
          // the slot goes back on the board the moment the session is released
          slotKey: null,
          holdExpiresAt: null,
          cancelledAt: now,
          cancelledBy: by,
          ...(by === "EXPERT" ? { closedBy: "EXPERT", closedAt: now, closeReason: args.reason || null } : {}),
          ...(proBonoReturned ? { proBonoPhone: null } : {}),
        },
      });
      if (claimed.count !== 1) throw new Conflict();

      if (payment && due.amount > 0) {
        const recorded = await tx.payment.updateMany({
          where: { bookingId: booking.id, status: PAYMENT_STATUS.paid, refundAmount: payment.refundAmount },
          data: {
            refundAmount: totalBack,
            refundedAt: now,
            status: totalBack >= payment.amount ? PAYMENT_STATUS.refunded : PAYMENT_STATUS.paid,
          },
        });
        if (recorded.count !== 1) throw new Conflict();
      }
    });
  } catch (err) {
    if (err instanceof Conflict) return { ok: false, code: "ALREADY_CHANGED" };
    throw err;
  }

  let refundPending = false;
  if (payment && due.amount > 0) {
    try {
      const result = await refund(due.amount);
      await prisma.payment.update({ where: { bookingId: booking.id }, data: { reference: result.reference } });
    } catch (err) {
      logFailure("booking.cancel.refund", err);
      refundPending = true;
      // the money did not move, so the record must not say it did
      await prisma.payment.update({
        where: { bookingId: booking.id },
        data: {
          refundAmount: payment.refundAmount,
          status: PAYMENT_STATUS.paid,
          refundedAt: alreadyBack > 0 ? undefined : null,
        },
      });
    }
  }

  const updated = await prisma.booking.findUniqueOrThrow({
    where: { id: booking.id },
    include: { payment: true },
  });
  return {
    ok: true,
    booking: updated,
    refunded: refundPending ? 0 : due.amount,
    full: !refundPending && due.full,
    note: refundPending
      ? "Your session is cancelled. Your refund didn't go through automatically — our team will send it and let you know."
      : due.note,
    refundPending,
    proBonoReturned,
  };
}

/**
 * Put back the slots nobody acted on.
 *
 * Two kinds lapse the same way: a request the practitioner never answered, and
 * an approved booking the client never paid for. Both were holding a time
 * somebody else could have had, and neither is going to happen now.
 */
export async function releaseExpiredHolds(now: Date = new Date()): Promise<number> {
  const { count } = await prisma.booking.updateMany({
    where: {
      status: { in: [BOOKING_STATUS.requested, BOOKING_STATUS.pendingPayment] },
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
  /** Which service was bought — the thing the price came from. */
  serviceSlug?: string | null;
  /** What they will actually pay, after any code. */
  amount: number;
  /** The fee before the code, so the receipt can show both. Null when undiscounted. */
  fullAmount?: number | null;
  couponCode?: string | null;
  holdExpiresAt: Date;
}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.booking.create({
        data: {
          ...data,
          ref: makeRef(),
          /* Requested, not pending payment: the practitioner has to agree
             before anybody's card is touched. The payment row is created now
             and stays PENDING so every screen that reads `payment` has
             something honest to show, but nothing is charged until the
             request is accepted and the client comes back to pay. */
          status: BOOKING_STATUS.requested,
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

/**
 * Where a person stands with the one free first session.
 *
 * "One per verified phone" is checked two ways, because either alone leaks:
 *  - the phone: a second account cannot claim with a phone that already has;
 *  - the account: someone who used it cannot change their number and go again.
 * The phone check is also enforced by the UNIQUE index on proBonoPhone, so a
 * race between two requests fails at the database, not just here.
 */
export type ProBonoStatus =
  | { state: "eligible"; phone: string }
  | { state: "needs-phone" }
  | { state: "used" };

export async function proBonoStatus(userId: string): Promise<ProBonoStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, phoneVerified: true },
  });
  if (!user?.phone || !user.phoneVerified) return { state: "needs-phone" };

  const claimed = await prisma.booking.findFirst({
    where: {
      OR: [{ proBonoPhone: user.phone }, { userId, proBonoPhone: { not: null } }],
    },
    select: { id: true },
  });
  return claimed ? { state: "used" } : { state: "eligible", phone: user.phone };
}

/**
 * The free session: requested like any other, at no charge, with a WAIVED
 * payment row so every screen that reads `payment` has something honest to
 * show. Free does not mean automatic — a practitioner agrees to their own
 * time whatever it costs, and a first session is the one most worth them
 * seeing before it happens.
 */
export async function createProBonoBooking(data: {
  userId: string;
  concern: string;
  expertId: string;
  expertName: string;
  date: string;
  time: string;
  serviceSlug?: string | null;
  phone: string;
}) {
  const { phone, ...fields } = data;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.booking.create({
        data: {
          ...fields,
          ref: makeRef(),
          amount: 0,
          status: BOOKING_STATUS.requested,
          holdExpiresAt: requestExpiry(data.date, data.time),
          slotKey: slotKey(data.expertId, data.date, data.time),
          proBono: true,
          proBonoPhone: phone,
          payment: { create: { amount: 0, status: PAYMENT_STATUS.waived } },
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
  return getExpert(id);
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
  fullAmount?: number | null;
  couponCode?: string | null;
  serviceSlug?: string | null;
  status: string;
  /** Optional so hand-built objects elsewhere still satisfy the type. */
  proBono?: boolean;
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
    serviceSlug: booking.serviceSlug ?? null,
    // only present when a code was used, so the card can show what came off
    fullAmount: booking.fullAmount ?? null,
    couponCode: booking.couponCode ?? null,
    status: booking.status,
    proBono: !!booking.proBono,
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
            // the service decides how long the room stays open; SESSION_MINUTES
            // is only the fallback for bookings made before it was recorded
            serviceSlug: booking.serviceSlug ?? null,
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