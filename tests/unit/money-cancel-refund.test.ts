import { beforeEach, describe, expect, it, vi } from "vitest";
// vi.mock calls below are hoisted above these imports
import { cancelBooking } from "@/lib/features/booking/server";
import { isCalendarDate, refundFor, validateSlot, PAYMENT_STATUS } from "@/lib/features/booking/policy";
import { isDate } from "@/lib/clinic-time";

/**
 * Money that must not leak through a cancellation or a date.
 *
 *   - Impossible dates ("2026-11-31") are refused: read as 1 December they
 *     carried a different slot key, so one real hour could be sold twice.
 *   - A client's refund is only what is still held — never the full fee again
 *     after an admin already gave part of it back.
 *   - A practitioner cancelling refunds the client in full, frees the slot,
 *     and records it; a cancellation claims the booking before money moves, so
 *     two at once cancel and refund exactly once.
 */

const db = vi.hoisted(() => ({
  booking: { updateMany: vi.fn(), findUniqueOrThrow: vi.fn() },
  payment: { updateMany: vi.fn(), update: vi.fn() },
  $transaction: vi.fn(),
}));
const gateway = vi.hoisted(() => ({ refund: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: db }));
vi.mock("@/lib/payments", () => gateway);

const NOW = new Date("2026-10-19T06:30:00Z"); // 12:00 IST

const booking = (over: Record<string, unknown> = {}) => ({
  id: "b1",
  status: "CONFIRMED",
  amount: 1000,
  date: "2026-10-19",
  time: "18:00", // six hours away: inside the 24-hour window
  rescheduleCount: 0,
  proBono: false,
  payment: { status: PAYMENT_STATUS.paid, amount: 1000, refundAmount: null as number | null, reference: "pay_1" },
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  db.$transaction.mockImplementation(async (fn: (tx: typeof db) => Promise<unknown>) => fn(db));
  db.booking.updateMany.mockResolvedValue({ count: 1 });
  db.payment.updateMany.mockResolvedValue({ count: 1 });
  db.payment.update.mockResolvedValue({});
  db.booking.findUniqueOrThrow.mockResolvedValue({ id: "b1", status: "CANCELLED", payment: null });
  gateway.refund.mockResolvedValue({ ok: true, reference: "rfnd_1" });
});

describe("dates", () => {
  it("refuses a day that does not exist, everywhere a date is read", () => {
    expect(isCalendarDate("2026-11-31")).toBe(false);
    expect(isCalendarDate("2026-12-01")).toBe(true);
    expect(isDate("2026-11-31")).toBe(false);
    expect(validateSlot("2026-11-31", "10:00", NOW)).toMatchObject({ ok: false, code: "BAD_DATE" });
    // inside the 14-day window by string comparison — the case the old check let through
    expect(validateSlot("2026-10-32", "10:00", NOW)).toMatchObject({ ok: false, code: "BAD_DATE" });
  });
});

describe("refundFor", () => {
  const twoDaysOut = { date: "2026-10-21", time: "18:00", status: "CONFIRMED", rescheduleCount: 0, amount: 1000 };

  it("gives back only what is still held after an admin's partial refund", () => {
    expect(refundFor(twoDaysOut, { status: PAYMENT_STATUS.paid, refundAmount: 400 }, NOW)).toMatchObject({
      amount: 600,
      full: false,
    });
  });

  it("gives back nothing more once it has all been returned", () => {
    expect(refundFor(twoDaysOut, { status: PAYMENT_STATUS.paid, refundAmount: 1000 }, NOW).amount).toBe(0);
  });

  it("still refunds in full when nothing went back before", () => {
    expect(refundFor(twoDaysOut, { status: PAYMENT_STATUS.paid, refundAmount: null }, NOW)).toMatchObject({
      amount: 1000,
      full: true,
    });
  });
});

describe("cancelBooking", () => {
  it("practitioner cancels inside 24 hours: the client gets everything back and the slot is freed", async () => {
    const out = await cancelBooking({ booking: booking(), by: "EXPERT", refund: "full", reason: "unwell", now: NOW });

    expect(out).toMatchObject({ ok: true, refunded: 1000, refundPending: false });
    const claim = db.booking.updateMany.mock.calls[0][0];
    expect(claim.where).toEqual({ id: "b1", status: "CONFIRMED" });
    expect(claim.data).toMatchObject({ status: "CANCELLED", slotKey: null, cancelledBy: "EXPERT", closedBy: "EXPERT" });
    expect(db.payment.updateMany.mock.calls[0][0]).toMatchObject({
      where: { bookingId: "b1", status: PAYMENT_STATUS.paid, refundAmount: null },
      data: { refundAmount: 1000, status: PAYMENT_STATUS.refunded },
    });
    expect(gateway.refund).toHaveBeenCalledWith(1000);
  });

  it("client cancels with notice after a partial refund: only the rest goes back, recorded as the total", async () => {
    const partly = booking({
      date: "2026-10-21",
      payment: { status: PAYMENT_STATUS.paid, amount: 1000, refundAmount: 400, reference: "pay_1" },
    });

    const out = await cancelBooking({ booking: partly, by: "USER", refund: "policy", now: NOW });

    expect(out).toMatchObject({ ok: true, refunded: 600 });
    expect(gateway.refund).toHaveBeenCalledWith(600);
    expect(db.payment.updateMany.mock.calls[0][0].data).toMatchObject({
      refundAmount: 1000,
      status: PAYMENT_STATUS.refunded,
    });
  });

  it("a second cancel of the same booking loses the claim and moves no money", async () => {
    db.booking.updateMany.mockResolvedValue({ count: 0 });

    const out = await cancelBooking({ booking: booking(), by: "USER", refund: "policy", now: NOW });

    expect(out).toEqual({ ok: false, code: "ALREADY_CHANGED" });
    expect(gateway.refund).not.toHaveBeenCalled();
  });

  it("a payment that changed underneath (a concurrent refund) rolls the cancel back", async () => {
    db.payment.updateMany.mockResolvedValue({ count: 0 });

    const out = await cancelBooking({ booking: booking(), by: "EXPERT", refund: "full", now: NOW });

    expect(out).toEqual({ ok: false, code: "ALREADY_CHANGED" });
    expect(gateway.refund).not.toHaveBeenCalled();
  });

  it("if the gateway refuses, the record is put back and the refund is reported pending", async () => {
    gateway.refund.mockRejectedValue(new Error("gateway down"));

    const out = await cancelBooking({ booking: booking(), by: "EXPERT", refund: "full", now: NOW });

    expect(out).toMatchObject({ ok: true, refunded: 0, refundPending: true });
    expect(db.payment.update).toHaveBeenCalledWith({
      where: { bookingId: "b1" },
      data: expect.objectContaining({ refundAmount: null, status: PAYMENT_STATUS.paid }),
    });
  });

  it("a free session the practitioner cancels is handed back, whatever the clock says", async () => {
    const free = booking({ proBono: true, amount: 0, payment: null });

    const out = await cancelBooking({ booking: free, by: "EXPERT", refund: "full", now: NOW });

    expect(out).toMatchObject({ ok: true, proBonoReturned: true });
    expect(db.booking.updateMany.mock.calls[0][0].data).toMatchObject({ proBonoPhone: null });
  });
});
