import { prisma } from "@/lib/db";
import { experts } from "@/lib/experts";
import {
  ALL_SLOTS,
  BOOKING_STATUS,
  HOLD_MINUTES,
  PAYMENT_STATUS,
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

export async function dayAvailability(expertId: string, date: string) {
  await releaseExpiredHolds();
  const taken = new Set(await takenSlots(expertId, date));
  return ALL_SLOTS.map((time) => ({ time, available: !taken.has(time) }));
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

export function serializeBooking(booking: BookingWithPayment) {
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