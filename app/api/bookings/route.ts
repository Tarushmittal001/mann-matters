import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { concerns } from "@/lib/experts";
import {
  createBookingWithRef,
  expertById,
  holdExpiry,
  isUniqueViolation,
  releaseExpiredHolds,
  serializeBooking,
  takenSlots,
} from "@/lib/features/booking/server";
import { HOLD_MINUTES, validateSlot } from "@/lib/features/booking/policy";
import { clientKey, errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Body = { concern?: string; expertId?: string; date?: string; time?: string };

/**
 * POST /api/bookings — hold a slot.
 *
 * This creates the booking as PENDING_PAYMENT with a short hold on the slot; it
 * becomes CONFIRMED only once payment succeeds. Nothing is charged here.
 */
export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();

    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const limited = rateLimit("booking", clientKey(req));
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const body = await readJson<Body>(req);
    if (!body) return errors.badBody();

    const concern = concerns.find((c) => c.id === body.concern);
    const expert = expertById(body.expertId ?? "");
    const date = typeof body.date === "string" ? body.date : "";
    const time = typeof body.time === "string" ? body.time : "";

    const fields: Record<string, string> = {};
    if (!concern) fields.concern = "Please choose what you'd like to talk about.";
    if (!expert) fields.expertId = "Please choose a therapist.";
    if (Object.keys(fields).length) return errors.validation(fields);

    const slotCheck = validateSlot(date, time);
    if (!slotCheck.ok) {
      return errors.validation({ time: slotCheck.reason }, slotCheck.reason);
    }

    // a lapsed hold shouldn't block a real booking
    await releaseExpiredHolds();

    try {
      const booking = await createBookingWithRef({
        userId: session.sub,
        concern: concern!.id,
        expertId: expert!.id,
        expertName: expert!.name,
        date,
        time,
        amount: expert!.price,
        holdExpiresAt: holdExpiry(),
      });

      return privateJson({
        booking: serializeBooking(booking),
        holdMinutes: HOLD_MINUTES,
      });
    } catch (err) {
      // the UNIQUE slot key did its job: somebody else got there first
      if (isUniqueViolation(err, "slotKey")) {
        const taken = await takenSlots(expert!.id, date);
        return privateJson(
          {
            error:
              "That time was taken while you were deciding. Here's what's still free on this day.",
            code: "SLOT_TAKEN",
            takenSlots: taken,
          },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (err) {
    logFailure("bookings.create", err);
    return errors.server();
  }
}

/** GET /api/bookings — the caller's own sessions, newest first. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return errors.unauthenticated();

    await releaseExpiredHolds();

    const bookings = await prisma.booking.findMany({
      where: { userId: session.sub },
      include: { payment: true },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    return privateJson({ bookings: bookings.map(serializeBooking) });
  } catch (err) {
    logFailure("bookings.list", err);
    return errors.server();
  }
}
