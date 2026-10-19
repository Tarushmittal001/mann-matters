import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendFollowUpEmail } from "@/lib/email";
import { expertIdFromSession } from "@/lib/expert-data";
import { clientKey, errors, isSameOrigin } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * POST /api/expert/sessions/:id/follow-up  { message? }
 *
 * The practitioner suggesting another session.
 *
 * ── AN INVITATION, NOT A BOOKING ───────────────────────────────────────────
 * It books nothing and charges nothing. The client gets a link and decides.
 * That distinction is the whole feature: a therapist who could put sessions
 * in their client's calendar would be a therapist their client could not
 * easily say no to, and "no" has to stay the easiest thing in the room.
 *
 * One live suggestion per practitioner per client, enforced by a unique index
 * — sending again replaces the last rather than stacking. Two nudges in a week
 * is pressure, and this is the one place pressure would do real harm.
 */

const MESSAGE_MAX = 300;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const expert = await expertIdFromSession();
    if (!expert) {
      return NextResponse.json(
        { error: "You need to be signed in as a practitioner." },
        { status: 401 }
      );
    }

    const limited = await rateLimit("followUp", `expert:${expert.session.sub || clientKey(req)}`);
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const body = (await req.json().catch(() => null)) as { message?: string } | null;
    const message = (body?.message ?? "").trim();
    if (message.length > MESSAGE_MAX) {
      return NextResponse.json(
        { error: `Please keep this under ${MESSAGE_MAX} characters.` },
        { status: 400 }
      );
    }

    /* Scoped to this practitioner's own calendar, so a booking id belonging to
       somebody else's client is a 404 rather than a way to email a stranger. */
    const booking = await prisma.booking.findFirst({
      where: { id: params.id, expertId: expert.expertId },
      select: {
        id: true,
        userId: true,
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

    const existing = await prisma.followUp.findUnique({
      where: { expertId_userId: { expertId: expert.expertId, userId: booking.userId } },
      select: { createdAt: true, actedAt: true },
    });
    /* Not a hard block, but not silent either: a second nudge inside a week,
       to somebody who has not answered the first, is the shape of pestering. */
    if (existing && !existing.actedAt) {
      const days = (Date.now() - existing.createdAt.getTime()) / 86_400_000;
      if (days < 7) {
        return NextResponse.json(
          {
            error:
              "You suggested a follow-up to this client in the last week and they have not answered yet. Give them a little longer.",
          },
          { status: 409 }
        );
      }
    }

    await prisma.followUp.upsert({
      where: { expertId_userId: { expertId: expert.expertId, userId: booking.userId } },
      update: { message, bookingId: booking.id, createdAt: new Date(), actedAt: null, outcome: null },
      create: {
        expertId: expert.expertId,
        userId: booking.userId,
        bookingId: booking.id,
        message,
      },
    });

    // the email is the nudge; the dashboard prompt is the reminder
    let delivered = true;
    try {
      await sendFollowUpEmail({
        to: booking.user.email,
        clientName: booking.user.name.split(" ")[0] || "there",
        expertName: booking.expertName,
        message,
        link: `${site.url}/book?expert=${expert.expertId}`,
      });
    } catch {
      delivered = false;
    }

    return NextResponse.json({ ok: true, delivered });
  } catch {
    return NextResponse.json({ error: "Something went wrong on our side." }, { status: 500 });
  }
}
