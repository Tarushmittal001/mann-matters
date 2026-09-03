import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { findUserBooking, releaseExpiredHolds, serializeBooking } from "@/lib/bookings";
import { BOOKING_STATUS, PAYMENT_STATUS } from "@/lib/booking-policy";
import { validateCard, validateUpi, type PayMethod } from "@/lib/payment-fields";
import { charge } from "@/lib/payments";
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
 */
export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();

    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const limited = rateLimit("payment", clientKey(req));
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

    const paid = await prisma.$transaction(async (tx) => {
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
      return tx.booking.update({
        where: { id: fresh.id },
        data: {
          status: BOOKING_STATUS.confirmed,
          // the slot is ours for good now; the hold no longer expires
          holdExpiresAt: null,
        },
        include: { payment: true },
      });
    });

    return privateJson({ booking: serializeBooking(paid) });
  } catch (err) {
    logFailure("payments.charge", err);
    return errors.server();
  }
}
