import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  findUserBooking,
  isUniqueViolation,
  releaseExpiredHolds,
  serializeBooking,
  takenSlots,
} from "@/lib/bookings";
import { canReschedule, slotKey, validateSlot } from "@/lib/booking-policy";
import { errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type Body = { date?: string; time?: string };

/**
 * POST /api/bookings/[id]/reschedule
 *
 * Moves a confirmed session to a new time with the same therapist. The payment
 * rides along untouched — the session is being moved, not re-bought.
 *
 * The old slot is released and the new one claimed in a single write: the
 * booking row *is* the slot record, so updating `slotKey` does both at once and
 * the UNIQUE constraint still rejects a collision with someone else's booking.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();

    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const booking = await findUserBooking(params.id, session);
    if (!booking) return errors.notFound("We couldn't find that session.");

    const allowed = canReschedule(booking);
    if (!allowed.ok) {
      return privateJson({ error: allowed.reason, code: allowed.code }, { status: 409 });
    }

    const body = await readJson<Body>(req);
    if (!body) return errors.badBody();

    const date = typeof body.date === "string" ? body.date : "";
    const time = typeof body.time === "string" ? body.time : "";

    const slotCheck = validateSlot(date, time);
    if (!slotCheck.ok) {
      return errors.validation({ time: slotCheck.reason }, slotCheck.reason);
    }

    if (date === booking.date && time === booking.time) {
      return errors.validation(
        { time: "That's the time you're already booked for." },
        "Pick a different time to move your session."
      );
    }

    await releaseExpiredHolds();

    try {
      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          date,
          time,
          slotKey: slotKey(booking.expertId, date, time),
          previousDate: booking.date,
          previousTime: booking.time,
          rescheduleCount: { increment: 1 },
        },
        include: { payment: true },
      });

      return privateJson({ booking: serializeBooking(updated) });
    } catch (err) {
      if (isUniqueViolation(err, "slotKey")) {
        const taken = await takenSlots(booking.expertId, date);
        return privateJson(
          {
            error: "That time has just been taken. Here's what's still free on this day.",
            code: "SLOT_TAKEN",
            takenSlots: taken,
          },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (err) {
    logFailure("bookings.reschedule", err);
    return errors.server();
  }
}
