import { prisma } from "@/lib/db";
import { BOOKING_STATUS } from "@/lib/features/booking/policy";

/**
 * Codes that take money off a session.
 *
 * Two different things arrive through the same box on the booking screen, and
 * a person typing one has no reason to know the difference:
 *
 *   - a **campaign code** an admin made, which is a `Coupon` row;
 *   - a **referral code**, which belongs to an account and is only good for
 *     somebody's genuine first session.
 *
 * `resolveCode` tells them apart and returns the same shape either way, so the
 * UI, the booking route and the receipt all speak one language. Everything is
 * decided on the server: the browser sends a string and is told a price, never
 * the other way round.
 */

/** Both halves of a referral are worth this much. */
export const REFERRAL_VALUE = 300;

/** A session can never be discounted below this — a ₹0 booking is a different product. */
export const MIN_CHARGE = 1;

export type Discount = {
  /** The code as it should be stored and printed: always upper case. */
  code: string;
  kind: "COUPON" | "REFERRAL";
  /** Rupees off, already clamped to the session price. */
  amount: number;
  /** What the client pays after it. */
  payable: number;
  /** One line, shown under the box. */
  label: string;
  /** Set for COUPON, so the redeem step doesn't have to look it up again. */
  couponId?: string;
  /** Set for REFERRAL: whose code it was. */
  referrerId?: string;
};

export type CodeResult = { ok: true; discount: Discount } | { ok: false; reason: string };

export function normaliseCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

function moneyOff(kind: string, value: number, price: number): number {
  const raw = kind === "PERCENT" ? Math.floor((price * value) / 100) : value;
  return Math.max(0, Math.min(raw, price - MIN_CHARGE));
}

/** Has this person ever actually had a session? Decides referral eligibility. */
export async function hasPaidBefore(userId: string): Promise<boolean> {
  const previous = await prisma.booking.findFirst({
    where: {
      userId,
      status: { in: [BOOKING_STATUS.confirmed, "COMPLETED", "NO_SHOW"] },
    },
    select: { id: true },
  });
  return !!previous;
}

/**
 * What a code is worth to this person, on a session at this price.
 *
 * Every refusal comes back as a sentence a person can act on, because "invalid
 * code" is the single most infuriating message in online checkout — it never
 * says whether you mistyped it, used it already, or are simply too late.
 */
export async function resolveCode(
  rawCode: string,
  userId: string,
  price: number,
  now: Date = new Date()
): Promise<CodeResult> {
  const code = normaliseCode(rawCode);
  if (!code) return { ok: false, reason: "Type a code first." };
  if (price <= MIN_CHARGE) {
    return { ok: false, reason: "This session is already free — there is nothing to take off." };
  }

  // ── a referral code? ──────────────────────────────────────────────────────
  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true, firstName: true, name: true },
  });

  if (referrer) {
    if (referrer.id === userId) {
      return {
        ok: false,
        reason: "That's your own code. Share it with a friend — you get ₹300 when they attend.",
      };
    }
    if (await hasPaidBefore(userId)) {
      return {
        ok: false,
        reason: "A referral code only works on a first session, and you've already had one.",
      };
    }
    const amount = moneyOff("FIXED", REFERRAL_VALUE, price);
    const who = (referrer.firstName || referrer.name || "").split(" ")[0];
    return {
      ok: true,
      discount: {
        code,
        kind: "REFERRAL",
        amount,
        payable: price - amount,
        label: who
          ? `₹${amount} off, from ${who}. They get ₹300 too, once you've been.`
          : `₹${amount} off your first session.`,
        referrerId: referrer.id,
      },
    };
  }

  // ── a campaign or reward coupon? ──────────────────────────────────────────
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) {
    return { ok: false, reason: "We don't recognise that code. Check the spelling and try again." };
  }
  if (coupon.status !== "ACTIVE") {
    return { ok: false, reason: "That code isn't being accepted any more." };
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) {
    return { ok: false, reason: "That code has expired." };
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, reason: "That code has been used up." };
  }
  if (coupon.ownerId && coupon.ownerId !== userId) {
    return { ok: false, reason: "That code belongs to somebody else's account." };
  }

  const already = await prisma.couponRedemption.findFirst({
    where: { couponId: coupon.id, userId },
    select: { id: true },
  });
  if (already) return { ok: false, reason: "You've already used that code." };

  const amount = moneyOff(coupon.kind, coupon.value, price);
  if (amount <= 0) {
    return { ok: false, reason: "That code takes nothing off this session." };
  }

  return {
    ok: true,
    discount: {
      code,
      kind: "COUPON",
      amount,
      payable: price - amount,
      label:
        coupon.kind === "PERCENT"
          ? `${coupon.value}% off — ₹${amount} less.`
          : `₹${amount} off.`,
      couponId: coupon.id,
    },
  };
}

/**
 * Bank the discount, now that the money has actually moved.
 *
 * Deliberately at payment, not at booking: a hold somebody abandons should not
 * spend a use of a limited code. The trade is that a code can overshoot its
 * `maxUses` by however many people were on the payment screen at once — which
 * is the right way round, because the alternative is charging somebody a price
 * they never agreed to while their card is already in the form.
 *
 * Runs inside the caller's transaction so it either all happens or none of it does.
 */
export async function redeemForBooking(
  tx: Pick<typeof prisma, "coupon" | "couponRedemption" | "user">,
  booking: { id: string; userId: string; couponCode: string | null; fullAmount: number | null; amount: number }
): Promise<void> {
  const code = booking.couponCode;
  if (!code) return;
  const off = (booking.fullAmount ?? booking.amount) - booking.amount;
  if (off <= 0) return;

  const coupon = await tx.coupon.findUnique({ where: { code }, select: { id: true } });

  if (coupon) {
    await tx.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    });
    await tx.couponRedemption.create({
      data: { couponId: coupon.id, userId: booking.userId, bookingId: booking.id, amount: off },
    });
    return;
  }

  // not a coupon, so it was a referral code: remember who sent them. Only ever
  // written once — a second session can't re-attribute somebody.
  const referrer = await tx.user.findUnique({ where: { referralCode: code }, select: { id: true } });
  if (!referrer) return;
  await tx.user.updateMany({
    where: { id: booking.userId, referredById: null },
    data: { referredById: referrer.id },
  });
}

/** Everything an admin needs to see about one code at a glance. */
export function couponState(
  coupon: { status: string; expiresAt: Date | null; maxUses: number | null; usedCount: number },
  now: Date = new Date()
): { label: string; tone: "live" | "spent" | "off" } {
  if (coupon.status !== "ACTIVE") return { label: "Paused", tone: "off" };
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) {
    return { label: "Expired", tone: "off" };
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { label: "Used up", tone: "spent" };
  }
  return { label: "Live", tone: "live" };
}
