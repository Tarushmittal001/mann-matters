import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BOOKING_STATUS, slotKey } from "@/lib/features/booking/policy";
import { findUserBooking, isUniqueViolation, serializeBooking } from "@/lib/features/booking/server";
import { errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { parseOptions, wasOffered } from "@/lib/reschedule-offers";

export const dynamic = "force-dynamic";

/**
 * POST /api/bookings/:id/reschedule-offer
 *   { date, time }  — take one of the times the practitioner offered
 *   { keep: true }  — leave it where it is
 *
 * The client answering an offer. This is the only thing that actually moves
 * the session: the practitioner proposed, the client decides.
 *
 * ── THE RACE ───────────────────────────────────────────────────────────────
 * The offered slots are not held, so between the offer and the pick somebody
 * else may have taken one. The move writes `slotKey`, which is UNIQUE, so the
 * database is what settles it — a loser gets a plain "that one just went" and
 * the rest of the offer, not a double booking.
 *
 * ── WHAT IT DOES NOT COUNT ─────────────────────────────────────────────────
 * `rescheduleCount` is the client's own allowance of changes. A move the
 * practitioner asked for is not the client spending one of those, so it is
 * deliberately left alone.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const booking = await findUserBooking(params.id, session);
    if (!booking) return errors.notFound("We couldn't find that session.");

    const offer = await prisma.rescheduleOffer.findUnique({
      where: { bookingId: booking.id },
    });
    if (!offer || offer.actedAt) {
      return errors.notFound("There is no open offer on that session.");
    }
    if (offer.expiresAt < new Date()) {
      await prisma.rescheduleOffer.update({
        where: { id: offer.id },
        data: { actedAt: new Date(), outcome: "EXPIRED" },
      });
      return privateJson(
        {
          error: "That offer has lapsed, so your original time still stands.",
          code: "OFFER_EXPIRED",
        },
        { status: 409 }
      );
    }

    const body = await readJson<{ date?: string; time?: string; keep?: boolean }>(req);
    if (!body) return errors.badBody();

    // ── keeping it where it is ──────────────────────────────────────────
    if (body.keep) {
      await prisma.rescheduleOffer.update({
        where: { id: offer.id },
        data: { actedAt: new Date(), outcome: "KEPT" },
      });
      return privateJson({ ok: true, kept: true });
    }

    const date = (body.date ?? "").trim();
    const time = (body.time ?? "").trim();
    const options = parseOptions(offer.options);
    if (!wasOffered(options, date, time)) {
      return errors.validation({ time: "Pick one of the times offered." });
    }
    if (booking.status !== BOOKING_STATUS.confirmed) {
      return privateJson(
        { error: "Only a confirmed session can be moved.", code: "NOT_CONFIRMED" },
        { status: 409 }
      );
    }

    try {
      const moved = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          previousDate: booking.date,
          previousTime: booking.time,
          date,
          time,
          // the UNIQUE index on this is what makes the race safe
          slotKey: slotKey(booking.expertId, date, time),
        },
        include: { payment: true },
      });
      await prisma.rescheduleOffer.update({
        where: { id: offer.id },
        data: { actedAt: new Date(), outcome: "MOVED", chosenDate: date, chosenTime: time },
      });

      return privateJson({ ok: true, booking: serializeBooking(moved) });
    } catch (err) {
      if (isUniqueViolation(err)) {
        /* Somebody took it while they were deciding. The offer stays open so
           the other times are still there — losing the race should cost them
           a click, not the whole offer. */
        return privateJson(
          {
            error: "That time was taken a moment ago. The others are still open.",
            code: "SLOT_TAKEN",
          },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (err) {
    logFailure("bookings.reschedule-offer", err);
    return errors.server();
  }
}
