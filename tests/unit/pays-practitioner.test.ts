import { describe, expect, it } from "vitest";
import { paysPractitioner } from "@/lib/payouts";

/**
 * Which sessions earn the practitioner their share.
 *
 * The case this exists for: a client cancels inside the 24-hour window, is not
 * refunded because "your therapist has already set the time aside", and the
 * practitioner must therefore be paid for that time.
 */
const paid = { status: "PAID", amount: 999, refundAmount: null };
const refundedInFull = { status: "REFUNDED", amount: 999, refundAmount: 999 };
const halfRefunded = { status: "PAID", amount: 999, refundAmount: 500 };

describe("paysPractitioner", () => {
  it("pays for held sessions, including a no-show", () => {
    expect(paysPractitioner({ status: "CONFIRMED", payment: paid })).toBe(true);
    expect(paysPractitioner({ status: "COMPLETED", payment: paid })).toBe(true);
    expect(paysPractitioner({ status: "NO_SHOW", payment: paid })).toBe(true);
  });

  it("pays for a late cancellation whose fee was kept", () => {
    expect(paysPractitioner({ status: "CANCELLED", payment: paid })).toBe(true);
  });

  it("pays for a late cancellation an admin partly refunded", () => {
    expect(paysPractitioner({ status: "CANCELLED", payment: halfRefunded })).toBe(true);
  });

  it("does not pay for a cancellation refunded in full (cancelled with notice)", () => {
    expect(paysPractitioner({ status: "CANCELLED", payment: refundedInFull })).toBe(false);
  });

  it("does not pay for a cancelled session that was never paid for", () => {
    expect(paysPractitioner({ status: "CANCELLED", payment: null })).toBe(false);
    expect(
      paysPractitioner({ status: "CANCELLED", payment: { status: "PENDING", amount: 999, refundAmount: null } })
    ).toBe(false);
  });

  it("never pays for requests, declines or expired holds", () => {
    expect(paysPractitioner({ status: "REQUESTED", payment: paid })).toBe(false);
    expect(paysPractitioner({ status: "DECLINED", payment: paid })).toBe(false);
    expect(paysPractitioner({ status: "EXPIRED", payment: paid })).toBe(false);
  });
});
