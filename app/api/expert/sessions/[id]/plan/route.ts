import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendDocumentIssuedEmail } from "@/lib/email";
import { expertIdFromSession } from "@/lib/expert-data";
import { getExpert } from "@/lib/experts-store";
import { clientKey, errors, isSameOrigin } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * POST /api/expert/sessions/:id/plan
 *
 * Sending the client their practice plan: an email with a link to the
 * letterhead copy at /plan/:id. The tasks are already on the client's
 * dashboard as soon as they are set; this is the practitioner saying "it's
 * ready" once they have finished writing, rather than one email per task.
 *
 * The booking is re-read scoped to the signed-in practitioner, so an id from
 * somebody else's calendar is a 404 — we do not confirm it exists.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const expert = await expertIdFromSession();
    if (!expert) {
      return NextResponse.json({ error: "You need to be signed in as a practitioner." }, { status: 401 });
    }

    const limited = await rateLimit("planSend", `expert:${expert.session.sub || clientKey(req)}`);
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const booking = await prisma.booking.findFirst({
      where: { id: params.id, expertId: expert.expertId },
      select: {
        id: true,
        expertName: true,
        user: { select: { email: true, name: true } },
        _count: { select: { homework: true } },
      },
    });
    if (!booking) {
      return NextResponse.json({ error: "We could not find that session on your calendar." }, { status: 404 });
    }
    if (booking._count.homework === 0) {
      return NextResponse.json({ error: "Add at least one thing to the plan before sending it." }, { status: 409 });
    }

    const listing = await getExpert(expert.expertId);
    let delivered = true;
    try {
      const sent = await sendDocumentIssuedEmail({
        to: booking.user.email,
        clientName: booking.user.name.split(" ")[0] || "there",
        expertName: listing?.name ?? booking.expertName,
        kind: "plan",
        link: `${site.url}/plan/${booking.id}`,
      });
      delivered = sent.delivered;
    } catch {
      delivered = false;
    }

    return NextResponse.json({ ok: true, delivered });
  } catch {
    return NextResponse.json({ error: "Something went wrong on our side." }, { status: 500 });
  }
}
