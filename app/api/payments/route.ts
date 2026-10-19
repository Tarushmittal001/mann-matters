import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { findUserBooking, releaseExpiredHolds, serializeBooking } from "@/lib/features/booking/server";
import { BOOKING_STATUS, PAYMENT_STATUS } from "@/lib/features/booking/policy";
import { validateCard, validateUpi, type PayMethod } from "@/lib/payment-fields";
import { charge, refund } from "@/lib/payments";
import { bookingCodeStillValid, redeemForBooking } from "@/lib/coupons";
import { clientKey, errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Body = {
  bookingId?: string;
  method?: PayMethod;
  card?: { number?: string; expiry?: string; cvv?: string; name?: string };
  vpa?: string;
};

/**
 * POST /api/payments — pay for a held booking, or retry a failed attempt.
 *
 * SECURITY NOTES, because this is the one endpoint that touches an instrument:
 *  - The card number and CVV are read from the request, handed to the gateway
 *    module, and dropped. They are never written to the database, never put in
 *    a log line, and never echoed back in a response.
 *  - The amount is read from the booking, never from the request body — a
 *    client cannot propose what it owes.
 *  - Ownership is checked before anything else; another person's booking id
 *    comes back as "not found".
 *
 * On success the booking flips to CONFIRMED and its slot hold becomes permanent.
 * On failure the hold is left alone so the user can retry without losing the time.
 *
 * ONLY A BOOKING AWAITING PAYMENT IS PAYABLE, and it is confirmed only if it
 * still is — still PENDING_PAYMENT and still holding its slot — at the moment
 * of confirming. The hold can lapse, or the client cancel, while the gateway is
 * answering; a second tab can pay first. In each case the charge just taken is
 * refunded on the spot rather than confirming a session that no longer has its
 * time (and could be double-booked) or keeping a second payment for one hour.
 */

class NotConfirmed extends Error {
  constructor(readonly kind: "HOLD_LOST" | "CODE", readonly reason = "") {
    super(kind);
  }
}
export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();

    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const limited = await rateLimit("payment", clientKey(req));
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const body = await readJson<Body>(req);
    if (!body?.bookingId) return errors.badBody();

    const booking = await findUserBooking(body.bookingId, session);
    if (!booking) return errors.notFound("We couldn't find that session.");

    if (booking.status === BOOKING_STATUS.confirmed) {
      // already paid — treat a repeat submit as success rather than double-charging
      return privateJson({ booking: serializeBooking(booking), alreadyPaid: true });
    }
    if (booking.status === BOOKING_STATUS.cancelled) {
      return privateJson(
        { error: "This session was cancelled and can't be paid for.", code: "CANCELLED" },
        { status: 409 }
      );
    }
    if (booking.status === BOOKING_STATUS.declined) {
      return privateJson(
        {
          error: "This request wasn't taken up, so there is nothing to pay for.",
          code: "DECLINED",
        },
        { status: 409 }
      );
    }
    /* The gate for the whole request-first flow. A booking is only payable
       once the practitioner has accepted it — otherwise a client who kept the
       payment screen open, or guessed at the endpoint, could pay for a session
       nobody has agreed to hold. */
    if (booking.status === BOOKING_STATUS.requested) {
      return privateJson(
        {
          error:
            "This is still with the therapist. We'll email you the moment they accept, and you can pay then — nothing has been charged.",
          code: "AWAITING_THERAPIST",
        },
        { status: 409 }
      );
    }

    // did the hold lapse while they were on the payment screen?
    await releaseExpiredHolds();
    const fresh = await findUserBooking(booking.id, session);
    if (!fresh || fresh.status === BOOKING_STATUS.expired) {
      return privateJson(
        {
          error:
            "We could only hold that time for a few minutes and the hold has lapsed. Nothing was charged — please pick a time again.",
          code: "HOLD_EXPIRED",
        },
        { status: 410 }
      );
    }

    if (fresh.status === BOOKING_STATUS.confirmed) {
      return privateJson({ booking: serializeBooking(fresh), alreadyPaid: true });
    }
    if (fresh.status !== BOOKING_STATUS.pendingPayment) {
      return privateJson(
        { error: "This session isn't waiting for payment, so there is nothing to pay.", code: "NOT_PAYABLE" },
        { status: 409 }
      );
    }

    /* A code that stopped being valid since the booking was made (used up, or
       used on another of their sessions) is caught before any money moves. The
       code comes off and the booking goes back to its full price, so what they
       see on retry is what they will pay — never a price they did not agree to. */
    const codeCheck = await bookingCodeStillValid(prisma, fresh);
    if (!codeCheck.ok) {
      const repriced = await dropCode(fresh);
      return privateJson(
        {
          error: `${codeCheck.reason} The price is now ₹${repriced.amount}. Nothing was charged.`,
          code: "CODE_NO_LONGER_VALID",
          booking: serializeBooking(repriced),
        },
        { status: 409 }
      );
    }

    const method: PayMethod = body.method === "card" ? "card" : "upi";

    const card = {
      number: body.card?.number ?? "",
      expiry: body.card?.expiry ?? "",
      cvv: body.card?.cvv ?? "",
      name: body.card?.name ?? "",
    };
    const vpa = (body.vpa ?? "").trim();

    const fields = method === "card" ? validateCard(card) : validateUpi(vpa);
    if (Object.keys(fields).length) return errors.validation(fields);

    const result = await charge({ method, amount: fresh.amount, card, vpa });

    if (!result.ok) {
      const updated = await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { bookingId: fresh.id },
          data: {
            status: PAYMENT_STATUS.failed,
            method,
            cardBrand: result.cardBrand ?? null,
            last4: result.last4 ?? null,
            vpaMasked: result.vpaMasked ?? null,
            failureCode: result.failure.code,
            failureMessage: result.failure.message,
            attempts: { increment: 1 },
          },
        });
        return tx.booking.findUnique({ where: { id: fresh.id }, include: { payment: true } });
      });

      return privateJson(
        {
          error: result.failure.message,
          code: result.failure.code,
          retryable: result.failure.retryable,
          booking: updated ? serializeBooking(updated) : null,
        },
        { status: 402 }
      );
    }

    let paid;
    try {
      paid = await prisma.$transaction(async (tx) => {
        // claim first: confirm only if it is still awaiting payment and still holds its slot
        const claimed = await tx.booking.updateMany({
          where: { id: fresh.id, status: BOOKING_STATUS.pendingPayment, slotKey: { not: null } },
          data: {
            status: BOOKING_STATUS.confirmed,
            // the slot is ours for good now; the hold no longer expires
            holdExpiresAt: null,
          },
        });
        if (claimed.count !== 1) throw new NotConfirmed("HOLD_LOST");

        // The code is banked here rather than at booking, so a hold somebody
        // walked away from never spends a use of a limited code.
        const redeemed = await redeemForBooking(tx, {
          id: fresh.id,
          userId: fresh.userId,
          couponCode: fresh.couponCode,
          fullAmount: fresh.fullAmount,
          amount: fresh.amount,
        });
        if (!redeemed.ok) throw new NotConfirmed("CODE", redeemed.reason);

        await tx.payment.update({
          where: { bookingId: fresh.id },
          data: {
            status: PAYMENT_STATUS.paid,
            method,
            cardBrand: result.cardBrand ?? null,
            last4: result.last4 ?? null,
            vpaMasked: result.vpaMasked ?? null,
            reference: result.reference,
            failureCode: null,
            failureMessage: null,
            attempts: { increment: 1 },
            paidAt: new Date(),
          },
        });
        return tx.booking.findUniqueOrThrow({ where: { id: fresh.id }, include: { payment: true } });
      });
    } catch (err) {
      if (!(err instanceof NotConfirmed)) throw err;
      return giveBack(fresh, result.reference, fresh.amount, err, session);
    }

    return privateJson({ booking: serializeBooking(paid) });
  } catch (err) {
    logFailure("payments.charge", err);
    return errors.server();
  }
}

/** Take a code that is no longer valid off a booking, back to its full price. */
async function dropCode(booking: { id: string; amount: number; fullAmount: number | null }) {
  return prisma.booking.update({
    where: { id: booking.id },
    data: { couponCode: null, amount: booking.fullAmount ?? booking.amount },
    include: { payment: true },
  });
}

/**
 * The money moved but the booking could not be confirmed: give it straight
 * back. A failed refund is logged with the booking id for the team to send by
 * hand, and the client is told so rather than told it went through.
 */
async function giveBack(
  booking: { id: string; amount: number; fullAmount: number | null },
  chargeReference: string,
  amount: number,
  why: NotConfirmed,
  session: { sub: string; role: string }
) {
  let refunded = true;
  try {
    await refund(amount);
  } catch (err) {
    refunded = false;
    logFailure(`payments.refund-unconfirmed booking=${booking.id}`, err);
  }
  const back = refunded
    ? "We've refunded the payment we just took — it usually lands in 5–7 working days."
    : "We couldn't refund the payment we just took automatically; our team will send it back and let you know.";

  const now = await findUserBooking(booking.id, session);

  // a second tab (or a double click) paid first: this charge was the duplicate
  if (now?.status === BOOKING_STATUS.confirmed) {
    return privateJson({ booking: serializeBooking(now), alreadyPaid: true, duplicateRefunded: refunded, note: back });
  }

  if (why.kind === "CODE") {
    const repriced = await dropCode(booking);
    return privateJson(
      {
        error: `${why.reason} The price is now ₹${repriced.amount}. ${back}`,
        code: "CODE_NO_LONGER_VALID",
        booking: serializeBooking(repriced),
      },
      { status: 409 }
    );
  }

  return privateJson(
    {
      error: `This time was released before your payment went through. ${back} Please pick a time again.`,
      code: "HOLD_EXPIRED",
      chargeReference,
      booking: now ? serializeBooking(now) : null,
    },
    { status: 410 }
  );
}
