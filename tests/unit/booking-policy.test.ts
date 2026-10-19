import { describe, expect, it } from "vitest";
import {
  BOOKING_STATUS,
  FREE_CHANGE_HOURS,
  HORIZON_DAYS,
  MAX_RESCHEDULES,
  PAYMENT_STATUS,
  canCancel,
  canReschedule,
  holdsSlot,
  istDateOffset,
  proBonoReturnsOnCancel,
  refundFor,
  sessionStart,
  slotKey,
  todayIST,
  validateSlot,
} from "@/lib/features/booking/policy";

// A fixed "now": 2026-06-10 09:00 IST (03:30 UTC). Every rule is tested against
// this instant so results never depend on when or where the suite runs.
const NOW = new Date("2026-06-10T03:30:00Z");

/** A booking that starts `hours` from NOW. */
function startingIn(hours: number, extra: Partial<{ status: string; rescheduleCount: number }> = {}) {
  const start = new Date(NOW.getTime() + hours * 3_600_000);
  const ist = new Date(start.getTime() + 5.5 * 3_600_000).toISOString();
  return {
    status: BOOKING_STATUS.confirmed,
    rescheduleCount: 0,
    amount: 150000,
    date: ist.slice(0, 10),
    time: ist.slice(11, 16),
    ...extra,
  };
}

describe("IST date math", () => {
  it("reads today in IST, not server time", () => {
    // 20:00 UTC on the 9th is already 01:30 on the 10th in India
    expect(todayIST(new Date("2026-06-09T20:00:00Z"))).toBe("2026-06-10");
    expect(todayIST(new Date("2026-06-09T18:00:00Z"))).toBe("2026-06-09");
  });

  it("anchors a session start to IST", () => {
    expect(sessionStart("2026-06-10", "10:00").toISOString()).toBe("2026-06-10T04:30:00.000Z");
  });

  it("offsets days from IST today", () => {
    expect(istDateOffset(1, NOW)).toBe("2026-06-11");
  });
});

describe("slots", () => {
  it("builds the unique slot key that enforces one booking per slot", () => {
    expect(slotKey("exp", "2026-06-11", "10:00")).toBe("exp|2026-06-11|10:00");
  });

  it("a confirmed booking always holds its slot; a lapsed hold does not", () => {
    expect(holdsSlot(BOOKING_STATUS.confirmed, null, NOW)).toBe(true);
    expect(holdsSlot(BOOKING_STATUS.pendingPayment, new Date(NOW.getTime() + 60_000), NOW)).toBe(true);
    expect(holdsSlot(BOOKING_STATUS.pendingPayment, new Date(NOW.getTime() - 1), NOW)).toBe(false);
    expect(holdsSlot(BOOKING_STATUS.pendingPayment, null, NOW)).toBe(false);
    expect(holdsSlot(BOOKING_STATUS.cancelled, null, NOW)).toBe(false);
    expect(holdsSlot(BOOKING_STATUS.expired, null, NOW)).toBe(false);
  });
});

describe("validateSlot", () => {
  const tomorrow = istDateOffset(1, NOW);

  it("accepts a known time tomorrow", () => {
    expect(validateSlot(tomorrow, "10:00", NOW)).toEqual({ ok: true });
  });

  it.each([
    ["not-a-date", "10:00", "BAD_DATE"],
    [tomorrow, "10:15", "BAD_TIME"],
    [todayIST(NOW), "21:00", "PAST_DATE"],
    ["2026-06-01", "10:00", "PAST_DATE"],
    [istDateOffset(HORIZON_DAYS + 1, NOW), "10:00", "BEYOND_HORIZON"],
  ])("rejects %s %s with %s", (date, time, code) => {
    const result = validateSlot(date, time, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(code);
  });

  it("accepts the last day of the horizon", () => {
    expect(validateSlot(istDateOffset(HORIZON_DAYS, NOW), "10:00", NOW)).toEqual({ ok: true });
  });
});

describe("canCancel", () => {
  it("allows cancelling a future session, even inside the 24-hour window", () => {
    expect(canCancel(startingIn(48), NOW).ok).toBe(true);
    expect(canCancel(startingIn(2), NOW).ok).toBe(true);
  });

  it.each([
    [startingIn(48, { status: BOOKING_STATUS.cancelled }), "ALREADY_CANCELLED"],
    [startingIn(48, { status: BOOKING_STATUS.expired }), "EXPIRED"],
    [startingIn(-1), "SESSION_PASSED"],
    [startingIn(0), "SESSION_PASSED"],
  ])("refuses %#: %s", (booking, code) => {
    const result = canCancel(booking, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(code);
  });
});

describe("canReschedule", () => {
  it("allows moving a confirmed session more than 24 hours out", () => {
    expect(canReschedule(startingIn(FREE_CHANGE_HOURS + 1), NOW).ok).toBe(true);
    expect(canReschedule(startingIn(FREE_CHANGE_HOURS), NOW).ok).toBe(true);
  });

  it.each([
    [startingIn(48, { status: BOOKING_STATUS.pendingPayment }), "NOT_CONFIRMED"],
    [startingIn(48, { rescheduleCount: MAX_RESCHEDULES }), "LIMIT_REACHED"],
    [startingIn(FREE_CHANGE_HOURS - 0.5), "TOO_LATE"],
    [startingIn(-1), "SESSION_PASSED"],
  ])("refuses %#: %s", (booking, code) => {
    const result = canReschedule(booking, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(code);
  });
});

describe("refundFor", () => {
  it("refunds in full at or beyond the 24-hour line", () => {
    expect(refundFor(startingIn(48), PAYMENT_STATUS.paid, NOW)).toMatchObject({ amount: 150000, full: true });
    expect(refundFor(startingIn(FREE_CHANGE_HOURS), PAYMENT_STATUS.paid, NOW)).toMatchObject({ amount: 150000, full: true });
  });

  it("refunds nothing inside the window", () => {
    expect(refundFor(startingIn(FREE_CHANGE_HOURS - 0.5), PAYMENT_STATUS.paid, NOW)).toMatchObject({ amount: 0, full: false });
  });

  it.each([null, PAYMENT_STATUS.pending, PAYMENT_STATUS.failed, PAYMENT_STATUS.refunded, PAYMENT_STATUS.waived])(
    "refunds nothing when the payment status is %s",
    (status) => {
      expect(refundFor(startingIn(48), status, NOW).amount).toBe(0);
    }
  );
});

describe("proBonoReturnsOnCancel", () => {
  it("returns the free session only when cancelled 24+ hours ahead", () => {
    expect(proBonoReturnsOnCancel(startingIn(FREE_CHANGE_HOURS), NOW)).toBe(true);
    expect(proBonoReturnsOnCancel(startingIn(FREE_CHANGE_HOURS - 0.5), NOW)).toBe(false);
  });
});
