import { beforeEach, describe, expect, it, vi } from "vitest";
// vi.mock calls below are hoisted above these imports
import { POST as pay } from "@/app/api/payments/route";
import { redeemForBooking } from "@/lib/coupons";

/**
 * Payment confirms only what is still payable, and codes are only spent once.
 *
 *   - Only a booking awaiting payment can be paid; a completed one cannot be
 *     paid and flipped back to CONFIRMED.
 *   - If the hold lapsed (or another tab paid) while the gateway answered, the
 *     booking is not confirmed without its slot: the charge is refunded.
 *   - A code is re-checked at payment, counted only while uses remain, and a
 *     person's redemptions run one at a time behind a lock on their own row.
 */

const db = vi.hoisted(() => ({
  booking: { updateMany: vi.fn(), findUniqueOrThrow: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  payment: { update: vi.fn() },
  coupon: { findUnique: vi.fn(), updateMany: vi.fn() },
  couponRedemption: { findFirst: vi.fn(), create: vi.fn() },
  user: { update: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
  $transaction: vi.fn(),
}));
const gateway = vi.hoisted(() => ({ charge: vi.fn(), refund: vi.fn() }));
const lookup = vi.hoisted(() => ({ findUserBooking: vi.fn() }));

vi.mock("@/lib/db", () => ({ prisma: db }));
vi.mock("@/lib/payments", () => gateway);
vi.mock("@/lib/auth", () => ({
  getSession: async () => ({ sub: "u1", role: "USER", name: "Test", email: "t@example.invalid" }),
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: async () => ({ ok: true }) }));
vi.mock("@/lib/features/booking/server", () => ({
  findUserBooking: lookup.findUserBooking,
  releaseExpiredHolds: async () => 0,
  serializeBooking: (b: unknown) => b,
}));

const request = (body: unknown) =>
  new Request("http://localhost/api/payments", {
    method: "POST",
    headers: { origin: "http://localhost", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const upi = { bookingId: "b1", method: "upi", vpa: "test@okbank" };

const held = (over: Record<string, unknown> = {}) => ({
  id: "b1",
  userId: "u1",
  status: "PENDING_PAYMENT",
  amount: 999,
  fullAmount: 999,
  couponCode: null,
  payment: { status: "PENDING" },
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  db.$transaction.mockImplementation(async (fn: (tx: typeof db) => Promise<unknown>) => fn(db));
  db.booking.updateMany.mockResolvedValue({ count: 1 });
  db.booking.findUniqueOrThrow.mockResolvedValue(held({ status: "CONFIRMED" }));
  db.payment.update.mockResolvedValue({});
  db.user.update.mockResolvedValue({});
  gateway.charge.mockResolvedValue({ ok: true, reference: "pay_1" });
  gateway.refund.mockResolvedValue({ ok: true, reference: "rfnd_1" });
});

describe("payment", () => {
  it("confirms a held booking only while it still holds its slot", async () => {
    lookup.findUserBooking.mockResolvedValue(held());

    const res = await pay(request(upi));

    expect(res.status).toBe(200);
    expect(db.booking.updateMany.mock.calls[0][0].where).toEqual({
      id: "b1",
      status: "PENDING_PAYMENT",
      slotKey: { not: null },
    });
    expect(gateway.refund).not.toHaveBeenCalled();
  });

  it("refunds the charge when the hold lapsed while the gateway was answering", async () => {
    lookup.findUserBooking
      .mockResolvedValueOnce(held())
      .mockResolvedValueOnce(held())
      .mockResolvedValueOnce(held({ status: "EXPIRED" }));
    db.booking.updateMany.mockResolvedValue({ count: 0 });

    const res = await pay(request(upi));

    expect(res.status).toBe(410);
    expect(gateway.refund).toHaveBeenCalledWith(999);
    expect(db.payment.update).not.toHaveBeenCalled(); // never recorded as paid
  });

  it("refunds a duplicate charge when another tab paid first, and reports it paid", async () => {
    lookup.findUserBooking
      .mockResolvedValueOnce(held())
      .mockResolvedValueOnce(held())
      .mockResolvedValueOnce(held({ status: "CONFIRMED" }));
    db.booking.updateMany.mockResolvedValue({ count: 0 });

    const res = await pay(request(upi));

    expect(res.status).toBe(200);
    expect((await res.json()).alreadyPaid).toBe(true);
    expect(gateway.refund).toHaveBeenCalledWith(999);
  });

  it("will not take money for a session that is not awaiting payment", async () => {
    lookup.findUserBooking.mockResolvedValue(held({ status: "COMPLETED" }));

    const res = await pay(request(upi));

    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("NOT_PAYABLE");
    expect(gateway.charge).not.toHaveBeenCalled();
  });

  it("drops a used-up code before charging, and quotes the full price", async () => {
    lookup.findUserBooking.mockResolvedValue(held({ amount: 799, fullAmount: 999, couponCode: "LAUNCH" }));
    db.coupon.findUnique.mockResolvedValue({ id: "c1", status: "ACTIVE", expiresAt: null, maxUses: 10, usedCount: 10 });
    db.booking.update.mockResolvedValue(held({ amount: 999, couponCode: null }));

    const res = await pay(request(upi));

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe("CODE_NO_LONGER_VALID");
    expect(body.error).toMatch(/₹999/);
    expect(gateway.charge).not.toHaveBeenCalled();
  });
});

describe("redeemForBooking", () => {
  const withCode = { id: "b1", userId: "u1", couponCode: "ONCE", fullAmount: 999, amount: 799 };

  it("locks the person's row before checking, so their redemptions run one at a time", async () => {
    db.coupon.findUnique.mockResolvedValue({ id: "c1", status: "ACTIVE", expiresAt: null, maxUses: null, usedCount: 0 });
    db.couponRedemption.findFirst.mockResolvedValue(null);
    db.coupon.updateMany.mockResolvedValue({ count: 1 });

    expect(await redeemForBooking(db as never, withCode)).toEqual({ ok: true });
    expect(db.user.update.mock.invocationCallOrder[0]).toBeLessThan(
      db.couponRedemption.findFirst.mock.invocationCallOrder[0]
    );
    expect(db.couponRedemption.create).toHaveBeenCalled();
  });

  it("refuses a code this person already used on another session", async () => {
    db.coupon.findUnique.mockResolvedValue({ id: "c1", status: "ACTIVE", expiresAt: null, maxUses: null, usedCount: 3 });
    db.couponRedemption.findFirst.mockResolvedValue({ id: "r0" });

    const out = await redeemForBooking(db as never, withCode);

    expect(out.ok).toBe(false);
    expect(db.coupon.updateMany).not.toHaveBeenCalled();
  });

  it("counts a limited code only while uses remain", async () => {
    db.coupon.findUnique.mockResolvedValue({ id: "c1", status: "ACTIVE", expiresAt: null, maxUses: 5, usedCount: 4 });
    db.couponRedemption.findFirst.mockResolvedValue(null);
    db.coupon.updateMany.mockResolvedValue({ count: 0 }); // a stranger took the last use

    const out = await redeemForBooking(db as never, withCode);

    expect(out.ok).toBe(false);
    expect(db.coupon.updateMany.mock.calls[0][0].where).toEqual({ id: "c1", usedCount: { lt: 5 } });
    expect(db.couponRedemption.create).not.toHaveBeenCalled();
  });

  it("refuses a referral code once the person has had a session", async () => {
    db.coupon.findUnique.mockResolvedValue(null);
    db.booking.findFirst.mockResolvedValue({ id: "earlier" });

    const out = await redeemForBooking(db as never, { ...withCode, couponCode: "FRIEND1" });

    expect(out.ok).toBe(false);
  });
});
