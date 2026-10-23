import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { concerns } from "@/lib/experts";
import {
  createBookingWithRef,
  createProBonoBooking,
  expertById,
  isUniqueViolation,
  offersSlot,
  proBonoStatus,
  releaseExpiredHolds,
  serializeBooking,
  takenSlots,
} from "@/lib/features/booking/server";
import { HOLD_MINUTES, requestExpiry, validateSlot } from "@/lib/features/booking/policy";
import { resolveCode } from "@/lib/coupons";
import { MINOR_AGE } from "@/lib/intake";
import {
  concernForService,
  expertOffersService,
  priceForBooking,
  serviceBySlug,
} from "@/lib/service-catalogue";
import { clientKey, errors, fail, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { ageOn, dobString } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Body = {
  /** Which service is being bought. The price comes from this, not the body. */
  service?: string;
  concern?: string;
  expertId?: string;
  date?: string;
  time?: string;
  proBono?: boolean;
  /** A discount or referral code, exactly as typed. Priced on the server. */
  code?: string;
  /** Required for a client under 18, and demanded here rather than trusted. */
  guardian?: { name?: string; phone?: string; consent?: boolean };
};

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

    const limited = await rateLimit("booking", clientKey(req));
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const body = await readJson<Body>(req);
    if (!body) return errors.badBody();

    const service = serviceBySlug(typeof body.service === "string" ? body.service : "");
    const expert = await expertById(body.expertId ?? "");
    const date = typeof body.date === "string" ? body.date : "";
    const time = typeof body.time === "string" ? body.time : "";
    const wantsFree = body.proBono === true;

    /**
     * The concern is derived from the service rather than asked for. It still
     * earns its place — it ranks therapists and tells the practitioner what
     * the session is about — but six concerns could never describe fourteen
     * services, and asking for it again after somebody has already chosen a
     * service was the redundant step.
     */
    const concernId = service ? concernForService(service.slug) : body.concern;
    const concern = concerns.find((c) => c.id === concernId) ?? concerns[concerns.length - 1];

    const fields: Record<string, string> = {};
    if (!service) fields.service = "Please choose what kind of session you want.";
    if (!expert) fields.expertId = "Please choose a therapist.";
    if (Object.keys(fields).length) return errors.validation(fields);

    // Qualification is a hard gate, not a filter the browser applies. Selling a
    // psychiatry consultation by a psychologist is the failure this prevents.
    if (!(await expertOffersService(expert!.id, service!.slug))) {
      return privateJson(
        {
          error: `${expert!.name} doesn't take ${service!.title} sessions. Pick someone who does, or choose a different kind of session.`,
          code: "SERVICE_NOT_OFFERED",
        },
        { status: 409 }
      );
    }

    // The one number anybody is charged: this practitioner's rate for this
    // service, read from the catalogue rather than taken from the request, so
    // a browser can neither propose a price nor pick a cheaper therapist's.
    const listPrice = await priceForBooking(expert!.id, service!.slug);
    if (listPrice === null) {
      return privateJson(
        { error: "That session is priced on request — please talk to us first.", code: "NO_PRICE" },
        { status: 409 }
      );
    }

    const slotCheck = validateSlot(date, time);
    if (!slotCheck.ok) {
      return errors.validation({ time: slotCheck.reason }, slotCheck.reason);
    }

    /**
     * An under-18 client cannot be booked without a named guardian who has
     * agreed. The age comes from their own account and the check happens here,
     * before a slot is touched — the screen asks the same question, but a
     * request that skips the screen must not skip the consent.
     *
     * It is worked out from a date of birth, never a typed age: an age goes
     * stale and could be retyped to 18 to skip this step. So nobody books
     * without one — an account made before we asked adds it to their profile
     * first — and it cannot be changed once they have booked (/api/profile).
     */
    const account = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        dateOfBirth: true,
        intake: { select: { guardianName: true, guardianPhone: true, guardianConsent: true } },
      },
    });
    if (!account?.dateOfBirth) {
      return fail(422, "Please add your date of birth to your profile before booking.", {
        code: "DOB_REQUIRED",
      });
    }
    const minor = ageOn(dobString(account.dateOfBirth)) < MINOR_AGE;
    const onFile =
      !!account?.intake?.guardianConsent &&
      !!account.intake.guardianName.trim() &&
      !!account.intake.guardianPhone.trim();

    let guardianToSave: { name: string; phone: string } | null = null;
    if (minor && !onFile) {
      const name = String(body.guardian?.name ?? "").trim().slice(0, 120);
      const phone = String(body.guardian?.phone ?? "").trim().slice(0, 20);
      const consent = body.guardian?.consent === true;

      const guardianFields: Record<string, string> = {};
      if (!name) guardianFields.guardianName = "We need a parent or guardian's name.";
      if (!/^[+]?[0-9 ()-]{8,18}$/.test(phone)) {
        guardianFields.guardianPhone = "We need a number we can reach them on.";
      }
      if (!consent) guardianFields.guardianConsent = "We can't book without this.";
      if (Object.keys(guardianFields).length) return errors.validation(guardianFields);

      guardianToSave = { name, phone };
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
        serviceSlug: service!.slug,
      };

      // A code never changes what the free session costs — it is already ₹0 —
      // and the price it produces is worked out here, never sent by the browser.
      const typed = typeof body.code === "string" ? body.code : "";
      const applied =
        !freePhone && typed
          ? await resolveCode(typed, session.sub, listPrice)
          : null;

      if (applied && !applied.ok) {
        return errors.validation({ code: applied.reason }, applied.reason);
      }

      const discount = applied?.ok ? applied.discount : null;

      const booking = freePhone
        ? await createProBonoBooking({ ...common, phone: freePhone })
        : await createBookingWithRef({
            ...common,
            amount: discount ? discount.payable : listPrice,
            fullAmount: discount ? listPrice : null,
            couponCode: discount ? discount.code : null,
            // held while the practitioner decides, not while a card is typed
            holdExpiresAt: requestExpiry(date, time),
          });

      // kept on the intake form, where the practitioner reads it
      if (guardianToSave) {
        await prisma.intakeForm.upsert({
          where: { userId: session.sub },
          create: {
            userId: session.sub,
            guardianName: guardianToSave.name,
            guardianPhone: guardianToSave.phone,
            guardianConsent: true,
          },
          update: {
            guardianName: guardianToSave.name,
            guardianPhone: guardianToSave.phone,
            guardianConsent: true,
          },
        });
      }

      return privateJson({
        booking: serializeBooking(booking),
        holdMinutes: freePhone ? null : HOLD_MINUTES,
        discount,
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
