import { dateWhere, type Range } from "@/lib/admin-period";
import { prisma } from "@/lib/db";
import { BOOKING_STATUS, PAYMENT_STATUS, todayIST } from "@/lib/features/booking/policy";

/**
 * Money in, and money out, by status.
 *
 * ── WHY "OWED TO US" IS NOT SIMPLY "STATUS = PENDING" ──────────────────────
 * A booking sits at PENDING for the few minutes somebody is typing their card
 * in, and that is not a debt. What matters is a pending or failed payment on a
 * session that has already happened, or whose hold has run out: those are
 * sessions a practitioner may have delivered for nothing. Nothing in the admin
 * surfaced them before, so they were invisible by construction.
 */

export type PaymentRow = {
  id: string;
  bookingId: string;
  ref: string;
  date: string;
  time: string;
  status: string;
  bookingStatus: string;
  amount: number;
  refundAmount: number | null;
  method: string | null;
  paidAt: Date | null;
  receiptNo: string | null;
  clientId: string;
  clientName: string;
  expertName: string;
};

export type PaymentStatusFilter = "all" | "PAID" | "PENDING" | "FAILED" | "REFUNDED" | "WAIVED";

export const PAYMENT_FILTERS: { value: PaymentStatusFilter; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: PAYMENT_STATUS.paid, label: "Confirmed" },
  { value: PAYMENT_STATUS.pending, label: "Awaited" },
  { value: PAYMENT_STATUS.failed, label: "Failed" },
  { value: PAYMENT_STATUS.refunded, label: "Refunded" },
  { value: PAYMENT_STATUS.waived, label: "Free" },
];

export const isPaymentFilter = (v: unknown): v is PaymentStatusFilter =>
  PAYMENT_FILTERS.some((f) => f.value === v);

const shape = (p: {
  id: string;
  status: string;
  amount: number;
  refundAmount: number | null;
  method: string | null;
  paidAt: Date | null;
  receiptNo: string | null;
  booking: {
    id: string;
    ref: string;
    date: string;
    time: string;
    status: string;
    expertName: string;
    userId: string;
    user: { name: string };
  };
}): PaymentRow => ({
  id: p.id,
  bookingId: p.booking.id,
  ref: p.booking.ref,
  date: p.booking.date,
  time: p.booking.time,
  status: p.status,
  bookingStatus: p.booking.status,
  amount: p.amount,
  refundAmount: p.refundAmount,
  method: p.method,
  paidAt: p.paidAt,
  receiptNo: p.receiptNo,
  clientId: p.booking.userId,
  clientName: p.booking.user.name,
  expertName: p.booking.expertName,
});

const SELECT = {
  id: true,
  status: true,
  amount: true,
  refundAmount: true,
  method: true,
  paidAt: true,
  receiptNo: true,
  booking: {
    select: {
      id: true,
      ref: true,
      date: true,
      time: true,
      status: true,
      expertName: true,
      userId: true,
      user: { select: { name: true } },
    },
  },
} as const;

/** Money in from clients, newest session first. */
export async function listPayments(filter: PaymentStatusFilter, range: Range, limit = 200) {
  /* Scoped by the session's date, not the payment's timestamp: the admin is
     asking "what happened in this period", and a session is the thing that
     happened. A card that cleared on Tuesday for a Friday session belongs to
     Friday, which is also how the payouts are worked out. */
  const inRange = dateWhere(range);
  const where = {
    ...(filter === "all" ? {} : { status: filter }),
    ...(inRange ? { booking: { date: inRange } } : {}),
  };

  const [rows, totals] = await Promise.all([
    prisma.payment.findMany({
      where,
      select: SELECT,
      orderBy: [{ booking: { date: "desc" } }, { booking: { time: "desc" } }],
      take: limit,
    }),
    prisma.payment.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { amount: true, refundAmount: true },
      where: inRange ? { booking: { date: inRange } } : {},
    }),
  ]);

  const by = (status: string) => totals.find((t) => t.status === status);
  /* Gross in, then refunds out. A refunded payment was collected — leaving it
     out of `collected` subtracts it twice, once here and once as a refund. */
  const collected =
    (by(PAYMENT_STATUS.paid)?._sum.amount ?? 0) + (by(PAYMENT_STATUS.refunded)?._sum.amount ?? 0);
  // read whatever the status says: a partial refund leaves the payment PAID
  const refunded = totals.reduce((n, t) => n + (t._sum.refundAmount ?? 0), 0);

  return {
    rows: rows.map(shape),
    truncated: rows.length === limit,
    counts: Object.fromEntries(totals.map((t) => [t.status, t._count._all])) as Record<string, number>,
    collected,
    refunded,
    net: collected - refunded,
    awaited:
      (by(PAYMENT_STATUS.pending)?._sum.amount ?? 0) + (by(PAYMENT_STATUS.failed)?._sum.amount ?? 0),
  };
}

/**
 * Sessions that may have been delivered without being paid for.
 *
 * A payment that never completed, on a booking whose date has passed and which
 * was not cancelled. The hold-expiry cases are excluded by status: an EXPIRED
 * booking released its slot and nobody sat through anything.
 */
export async function moneyLeftOnTheTable() {
  const rows = await prisma.payment.findMany({
    where: {
      status: { in: [PAYMENT_STATUS.pending, PAYMENT_STATUS.failed] },
      booking: {
        date: { lt: todayIST() },
        status: {
          in: [BOOKING_STATUS.confirmed, BOOKING_STATUS.completed, BOOKING_STATUS.noShow],
        },
      },
    },
    select: SELECT,
    orderBy: [{ booking: { date: "desc" } }],
  });
  const out = rows.map(shape);
  return { rows: out, total: out.reduce((sum, r) => sum + r.amount, 0) };
}
