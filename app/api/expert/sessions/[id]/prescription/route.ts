import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { expertIdFromSession } from "@/lib/expert-data";
import { sendDocumentIssuedEmail } from "@/lib/email";
import { getExpert } from "@/lib/experts-store";
import { clientKey, errors, isSameOrigin } from "@/lib/http";
import { checkItems, nextRxNumber } from "@/lib/prescriptions";
import { canPrescribe } from "@/lib/professions";
import { rateLimit } from "@/lib/rate-limit";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * POST /api/expert/sessions/:id/prescription
 *   { items: [...], advice?, followUpDays? }
 *
 * Issuing a prescription.
 *
 * ── THE GATE ───────────────────────────────────────────────────────────────
 * `canPrescribe(profession)` — a psychiatrist, and nobody else. A clinical
 * psychologist cannot prescribe in India, so this is not a UI preference to be
 * hidden behind a flag: the check lives here, on the route, where hiding a
 * button cannot get round it. The registration number is required too, because
 * a prescription without one is not a prescription any pharmacy can act on.
 *
 * ── WHAT IS WRITTEN DOWN ───────────────────────────────────────────────────
 * The prescriber's name, credentials and registration number are copied in at
 * the moment of issue. If they were read live from the profile, editing that
 * profile would rewrite every prescription ever issued under it.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const expert = await expertIdFromSession();
    if (!expert) {
      return NextResponse.json({ error: "You need to be signed in as a practitioner." }, { status: 401 });
    }

    const limited = await rateLimit("prescription", `expert:${expert.session.sub || clientKey(req)}`);
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const listing = await getExpert(expert.expertId);
    if (!listing || !canPrescribe(listing.profession)) {
      return NextResponse.json(
        {
          error:
            "Only a registered psychiatrist can issue a prescription. If that is you and this is wrong, our team can correct your listing.",
        },
        { status: 403 }
      );
    }
    if (!listing.registrationNo?.trim()) {
      return NextResponse.json(
        {
          error:
            "Your medical council registration number is missing from your listing. A prescription cannot be issued without it — ask our team to add it.",
        },
        { status: 409 }
      );
    }

    const body = (await req.json().catch(() => null)) as
      | { items?: unknown; advice?: string; followUpDays?: number }
      | null;
    if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

    const checked = checkItems(body.items);
    if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });

    // scoped to this practitioner's own calendar
    const booking = await prisma.booking.findFirst({
      where: { id: params.id, expertId: expert.expertId },
      select: { id: true, userId: true, user: { select: { email: true, name: true } } },
    });
    if (!booking) {
      return NextResponse.json(
        { error: "We could not find that session on your calendar." },
        { status: 404 }
      );
    }

    const followUpDays = Math.max(0, Math.min(365, Math.trunc(Number(body.followUpDays ?? 0)) || 0));

    const rx = await prisma.prescription.create({
      data: {
        number: await nextRxNumber(),
        bookingId: booking.id,
        userId: booking.userId,
        expertId: expert.expertId,
        prescriberName: listing.name,
        prescriberCreds: listing.credentials ?? "",
        registrationNo: listing.registrationNo,
        items: JSON.stringify(checked.items),
        advice: (body.advice ?? "").trim().slice(0, 1000),
        followUpDays,
      },
      select: { id: true, number: true },
    });

    /* Issuing is sending: it is on the client's dashboard from this moment,
       and the email tells them so. A failed email does not undo the issue. */
    let delivered = true;
    try {
      const sent = await sendDocumentIssuedEmail({
        to: booking.user.email,
        clientName: booking.user.name.split(" ")[0] || "there",
        expertName: listing.name,
        kind: "prescription",
        link: `${site.url}/prescription/${rx.id}`,
      });
      delivered = sent.delivered;
    } catch {
      delivered = false;
    }

    return NextResponse.json({ ok: true, id: rx.id, number: rx.number, delivered });
  } catch {
    return NextResponse.json({ error: "Something went wrong on our side." }, { status: 500 });
  }
}

/** PATCH — withdraw one. Never an edit; a cancellation and a fresh one. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const expert = await expertIdFromSession();
    if (!expert) {
      return NextResponse.json({ error: "You need to be signed in as a practitioner." }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as
      | { prescriptionId?: string; reason?: string }
      | null;
    const reason = (body?.reason ?? "").trim();
    if (!body?.prescriptionId || reason.length < 4) {
      return NextResponse.json(
        { error: "Say why you are withdrawing it — it stays on the record." },
        { status: 400 }
      );
    }

    const done = await prisma.prescription.updateMany({
      // their own, on their own session, and not already withdrawn
      where: {
        id: body.prescriptionId,
        expertId: expert.expertId,
        bookingId: params.id,
        cancelledAt: null,
      },
      data: { cancelledAt: new Date(), cancelReason: reason.slice(0, 300) },
    });
    if (done.count === 0) {
      return NextResponse.json({ error: "That prescription is not yours to withdraw." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong on our side." }, { status: 500 });
  }
}
