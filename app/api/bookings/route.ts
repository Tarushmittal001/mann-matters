import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { concerns } from "@/lib/experts";
import {
  createBookingWithRef,
  createProBonoBooking,
  expertById,
  holdExpiry,
  isUniqueViolation,
  offersSlot,
  proBonoStatus,
  releaseExpiredHolds,
  serializeBooking,
  takenSlots,
} from "@/lib/features/booking/server";
import { HOLD_MINUTES, validateSlot } from "@/lib/features/booking/policy";
import { clientKey, errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Body = { concern?: string; expertId?: string; date?: string; time?: string; proBono?: boolean };

/** Said the same way wherever the free session turns out to be spent. */
const PRO_BONO_USED =
  "Your free session has already been used. You can still book this time as a regular session.";

/**
 * POST /api/bookings — hold a slot, or book the free first session.
 *
 * A regular booking is created as PENDING_PAYMENT with a short hold on the
 * slot; it becomes CONFIRMED only once payment succeeds. Nothing is charged
 * here.
 *
 * With `proBono: true` it is the one free session instead: eligibility is
 * decided here on the server (a verified phone that has not claimed before),
 * never taken from the client, and the booking is confirmed at ₹0 on the spot.
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
    const wantsFree = body.proBono === true;

    const fields: Record<string, string> = {};
    if (!concern) fields.concern = "Please choose what you'd like to talk about.";
    if (!expert) fields.expertId = "Please choose a therapist.";
    if (Object.keys(fields).length) return errors.validation(fields);

    const slotCheck = validateSlot(date, time);
    if (!slotCheck.ok) {
      return errors.validation({ time: slotCheck.reason }, slotCheck.reason);
    }

    // decided before touching the calendar, so a refusal costs nobody a slot
    let freePhone: string | null = null;
    if (wantsFree) {
      const status = await proBonoStatus(session.sub);
      if (status.state === "needs-phone") {
        return privateJson(
          {
            error:
              "Your free session is tied to a verified phone number. Verify yours in your profile, then come back to book it.",
            code: "PHONE_REQUIRED",
          },
          { status: 403 }
        );
      }
      if (status.state === "used") {
        return privateJson({ error: PRO_BONO_USED, code: "PRO_BONO_USED" }, { status: 409 });
      }
      freePhone = status.phone;
    }

    // a lapsed hold shouldn't block a real booking
    await releaseExpiredHolds();

    // The practitioner's own hours have the last word. The calendar is derived
    // from these rows, so a request for a time outside them is either a stale
    // screen or a hand-made payload — and a booking nobody agreed to work is
    // worse for the client than a refusal they can act on.
    if (!(await offersSlot(expert!.id, date, time))) {
      const taken = await takenSlots(expert!.id, date);
      return privateJson(
        {
          error:
            "That time isn't open on this therapist's calendar. Here's what's still free on this day.",
          code: "SLOT_UNAVAILABLE",
          takenSlots: taken,
        },
        { status: 409 }
      );
    }

    try {
      const common = {
        userId: session.sub,
        concern: concern!.id,
        expertId: expert!.id,
        expertName: expert!.name,
        date,
        time,
      };

      const booking = freePhone
        ? await createProBonoBooking({ ...common, phone: freePhone })
        : await createBookingWithRef({ ...common, amount: expert!.price, holdExpiresAt: holdExpiry() });

      return privateJson({
        booking: serializeBooking(booking),
        holdMinutes: freePhone ? null : HOLD_MINUTES,
      });
    } catch (err) {
      // two requests raced for the same free claim; the UNIQUE index decided
      if (isUniqueViolation(err, "proBonoPhone")) {
        return privateJson({ error: PRO_BONO_USED, code: "PRO_BONO_USED" }, { status: 409 });
      }
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

    return privateJson({ bookings: bookings.map((booking) => serializeBooking(booking)) });
  } catch (err) {
    logFailure("bookings.list", err);
    return errors.server();
  }
}
