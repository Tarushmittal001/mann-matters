import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendRescheduleOfferEmail } from "@/lib/email";
import { expertIdFromSession } from "@/lib/expert-data";
import { BOOKING_STATUS } from "@/lib/features/booking/policy";
import { clientKey, errors, isSameOrigin } from "@/lib/http";
import { checkOffer, offerExpiry } from "@/lib/reschedule-offers";
import { rateLimit } from "@/lib/rate-limit";
import { site } from "@/lib/site";
import { formatDateISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * POST /api/expert/sessions/:id/reschedule
 *   { dates: [{ date, times: [..] }], reason }
 *
 * The practitioner needing to move a session, offering the client times that
 * work instead.
 *
 * ── IT DOES NOT MOVE ANYTHING ──────────────────────────────────────────────
 * The booking stays exactly where it is until the client picks. A therapist
 * who could move a client's appointment unilaterally would be a therapist
 * whose clients cannot rely on their own calendar — and if the client never
 * answers, the original time simply stands and is still theirs.
 *
 * The offered slots are not held either. Holding six times to move one
 * session would block most of a week for one person; the client's pick is
 * settled against the UNIQUE slotKey instead, which is what decides a race.
 */

const REASON_MAX = 300;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const expert = await expertIdFromSession();
    if (!expert) {
      return NextResponse.json({ error: "You need to be signed in as a practitioner." }, { status: 401 });
    }

    const limited = await rateLimit("reschedule", `expert:${expert.session.sub || clientKey(req)}`);
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const body = (await req.json().catch(() => null)) as
      | { dates?: unknown; reason?: string }
      | null;
    if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

    const reason = (body.reason ?? "").trim();
    if (reason.length < 4) {
      return NextResponse.json(
        { error: "Say why you need to move it — the client is shown this." },
        { status: 400 }
      );
    }
    if (reason.length > REASON_MAX) {
      return NextResponse.json(
        { error: `Please keep this under ${REASON_MAX} characters.` },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findFirst({
      where: { id: params.id, expertId: expert.expertId },
      select: {
        id: true,
        date: true,
        time: true,
        status: true,
        expertName: true,
        user: { select: { name: true, email: true } },
      },
    });
    if (!booking) {
      return NextResponse.json(
        { error: "We could not find that session on your calendar." },
        { status: 404 }
      );
    }
    if (booking.status !== BOOKING_STATUS.confirmed) {
      return NextResponse.json(
        { error: "Only a confirmed session can be moved. Answer the request first." },
        { status: 409 }
      );
    }

    const checked = checkOffer(body.dates, booking.date, booking.time);
    if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });

    /* Times this practitioner has already given away. Offering a slot that is
       taken wastes the client's one decision, so they are dropped here rather
       than failing at the pick. */
    const dates = checked.options.map((o) => o.date);
    const taken = await prisma.booking.findMany({
      where: { expertId: expert.expertId, date: { in: dates }, slotKey: { not: null } },
      select: { date: true, time: true },
    });
    const isTaken = (d: string, t: string) => taken.some((b) => b.date === d && b.time === t);

    const free = checked.options
      .map((o) => ({ date: o.date, times: o.times.filter((t) => !isTaken(o.date, t)) }))
      .filter((o) => o.times.length > 0);

    if (free.length === 0) {
      return NextResponse.json(
        { error: "Every time you offered is already booked. Pick others." },
        { status: 409 }
      );
    }

    const expiresAt = offerExpiry(free);
    await prisma.rescheduleOffer.upsert({
      where: { bookingId: booking.id },
      update: {
        expertId: expert.expertId,
        options: JSON.stringify(free),
        reason,
        expiresAt,
        chosenDate: null,
        chosenTime: null,
        actedAt: null,
        outcome: null,
        createdAt: new Date(),
      },
      create: {
        bookingId: booking.id,
        expertId: expert.expertId,
        options: JSON.stringify(free),
        reason,
        expiresAt,
      },
    });

    let delivered = true;
    try {
      await sendRescheduleOfferEmail({
        to: booking.user.email,
        clientName: booking.user.name.split(" ")[0] || "there",
        expertName: booking.expertName,
        was: `${formatDateISO(booking.date)} at ${booking.time}`,
        reason,
        options: free,
        link: `${site.url}/dashboard`,
      });
    } catch {
      delivered = false;
    }

    return NextResponse.json({
      ok: true,
      delivered,
      offered: free,
      dropped: checked.options.length - free.length,
      expiresAt: expiresAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong on our side." }, { status: 500 });
  }
}
