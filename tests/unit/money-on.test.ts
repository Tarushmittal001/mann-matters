import { describe, expect, it } from "vitest";
import { moneyOn } from "@/lib/payouts";

/**
 * What one payment did to the bank balance.
 *
 * The case that matters most is a refunded session: the money came in and
 * then went back, so it is collected 999 / refunded 999 / net nil — not
 * collected nil / refunded 999, which nets to minus 999 for a session that
 * broke even and, on a held session, came out of the practitioner's payout.
 */
const net = (p: Parameters<typeof moneyOn>[0]) => {
  const m = moneyOn(p);
  return m.collected - m.refunded;
};

describe("moneyOn", () => {
  it("counts a paid payment as collected", () => {
    expect(moneyOn({ status: "PAID", amount: 999, refundAmount: null })).toEqual({
      collected: 999,
      refunded: 0,
    });
  });

  it("a fully refunded payment nets to nothing, not to minus the fee", () => {
    const p = { status: "REFUNDED", amount: 999, refundAmount: 999 };
    expect(moneyOn(p)).toEqual({ collected: 999, refunded: 999 });
    expect(net(p)).toBe(0);
  });

  it("a partial refund leaves the rest collected", () => {
    const p = { status: "PAID", amount: 999, refundAmount: 400 };
    expect(moneyOn(p)).toEqual({ collected: 999, refunded: 400 });
    expect(net(p)).toBe(599);
  });

  it("never refunds more than came in, whatever the column says", () => {
    expect(moneyOn({ status: "PAID", amount: 999, refundAmount: 5000 })).toEqual({
      collected: 999,
      refunded: 999,
    });
    expect(net({ status: "PAID", amount: 999, refundAmount: 5000 })).toBe(0);
  });

  it("ignores money that never arrived", () => {
    for (const status of ["PENDING", "FAILED", "WAIVED"]) {
      expect(moneyOn({ status, amount: 999, refundAmount: null }), status).toEqual({
        collected: 0,
        refunded: 0,
      });
    }
  });

  it("a free session moves nothing", () => {
    expect(moneyOn({ status: "WAIVED", amount: 0, refundAmount: null })).toEqual({
      collected: 0,
      refunded: 0,
    });
  });

  it("a booking with no payment row moves nothing", () => {
    expect(moneyOn(null)).toEqual({ collected: 0, refunded: 0 });
  });
});
