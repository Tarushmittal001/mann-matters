import { randomInt } from "node:crypto";
import { prisma } from "@/lib/db";
import { REFERRAL_VALUE } from "@/lib/coupons";
import { BOOKING_STATUS } from "@/lib/features/booking/policy";

/**
 * Referrals: ₹300 to the friend, ₹300 back to whoever sent them.
 *
 * The friend's half is immediate — they type the code at booking and the price
 * drops. The sender's half waits until the friend has actually *attended*,
 * because a reward paid on a booking is a reward paid on an intention, and
 * intentions get cancelled. It arrives as an ordinary personal coupon, so it
 * redeems through exactly the same path as everything else.
 *
 * Nothing here tells either person anything about the other's sessions. The
 * sender sees a count and a credit; they never see who booked what, or when.
 */

/** No I, O, S, 0, 1, 5 — this gets read aloud and typed from a screenshot. */
const ALPHABET = "ABCDEFGHJKLMNPQRTUVWXYZ2346789";

function randomTail(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/** "PRIYA-K4M2" when we have a first name to work with, "EM-7QK4M2" when we don't. */
function candidate(firstName: string | null): string {
  const stem = (firstName ?? "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 6);
  return stem.length >= 3 ? `${stem}-${randomTail(4)}` : `EM-${randomTail(6)}`;
}

/**
 * This person's code, made the first time they ask for it.
 *
 * Generated lazily rather than at sign-up, because most people never share one
 * and an unused code in every row is just a table of clutter waiting to
 * collide with something.
 */
export async function referralCodeFor(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, firstName: true, name: true },
  });
  if (!user) throw new Error("no such user");
  if (user.referralCode) return user.referralCode;

  const first = user.firstName || user.name.split(" ")[0] || null;

  for (let attempt = 0; attempt < 8; attempt++) {
    const code = candidate(attempt < 5 ? first : null);
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { referralCode: true },
      });
      return updated.referralCode!;
    } catch (error) {
      // somebody already has that one; take another
      if ((error as { code?: string })?.code === "P2002") continue;
      throw error;
    }
  }
  throw new Error("could not allocate a referral code");
}

/** The reward coupon's code is derived from the friend, so it can only ever be made once. */
function rewardCode(friendId: string): string {
  return `THANKS-${friendId.slice(-6).toUpperCase()}`;
}

/**
 * Pay the sender, if this session is the one that earns it.
 *
 * Called when a session completes. Safe to call twice: the reward coupon's
 * code is unique and derived from the friend's id, so a second attempt hits
 * the UNIQUE index and does nothing. The reward is owed once per friend, not
 * once per session, which is why the code carries the friend and not the
 * booking.
 */
export async function rewardReferrerFor(bookingId: string): Promise<string | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      userId: true,
      status: true,
      user: { select: { referredById: true, firstName: true, name: true } },
    },
  });
  if (!booking) return null;

  const referrerId = booking.user.referredById;
  if (!referrerId) return null;
  if (booking.status !== "COMPLETED" && booking.status !== BOOKING_STATUS.confirmed) return null;

  const code = rewardCode(booking.userId);
  const friend = (booking.user.firstName || booking.user.name || "a friend").split(" ")[0];

  try {
    await prisma.coupon.create({
      data: {
        code,
        kind: "FIXED",
        value: REFERRAL_VALUE,
        note: `Referral reward — ${friend} attended their first session`,
        ownerId: referrerId,
        maxUses: 1,
        status: "ACTIVE",
      },
    });
    return code;
  } catch (error) {
    // already paid, which is exactly what the unique code is there to guarantee
    if ((error as { code?: string })?.code === "P2002") return code;
    throw error;
  }
}

export type ReferralSummary = {
  code: string;
  /** Friends who used the code and paid for a session. */
  joined: number;
  /** How many of those have actually attended, so a reward exists. */
  attended: number;
  /** Credit sitting in the account right now, in rupees. */
  creditAvailable: number;
  /** Credit already spent. */
  creditUsed: number;
  /** The unspent reward codes, so the page can show them. */
  openCodes: { code: string; value: number; expiresAt: Date | null }[];
};

/** Everything the referral page shows, in one round trip. */
export async function referralSummary(userId: string): Promise<ReferralSummary> {
  const code = await referralCodeFor(userId);

  const [friends, coupons, spent] = await Promise.all([
    prisma.user.findMany({
      where: { referredById: userId },
      select: {
        id: true,
        bookings: {
          where: { status: { in: [BOOKING_STATUS.confirmed, "COMPLETED", "NO_SHOW"] } },
          select: { status: true },
        },
      },
    }),
    prisma.coupon.findMany({
      where: { ownerId: userId, status: "ACTIVE" },
      select: { code: true, value: true, expiresAt: true, maxUses: true, usedCount: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.couponRedemption.aggregate({
      _sum: { amount: true },
      where: { userId, coupon: { ownerId: userId } },
    }),
  ]);

  const open = coupons.filter((c) => c.maxUses === null || c.usedCount < c.maxUses);

  return {
    code,
    joined: friends.length,
    attended: friends.filter((f) => f.bookings.some((b) => b.status === "COMPLETED")).length,
    creditAvailable: open.reduce((sum, c) => sum + c.value, 0),
    creditUsed: spent._sum.amount ?? 0,
    openCodes: open.map((c) => ({ code: c.code, value: c.value, expiresAt: c.expiresAt })),
  };
}
