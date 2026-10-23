import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { expertIdFromSession } from "@/lib/expert-data";
import { sendBookingAcceptedEmail, sendBookingDeclinedEmail, sendSessionCancelledEmail } from "@/lib/email";
import { BOOKING_STATUS, requestExpiry } from "@/lib/features/booking/policy";
import { cancelBooking } from "@/lib/features/booking/server";
import { rewardReferrerFor } from "@/lib/referral";
import { site } from "@/lib/site";
import { formatDateISO } from "@/lib/utils";
import {
  isSessionStatus,
  meetingAccess,
  sessionMinutesAway,
  validateMeetingUrl,
  type SessionStatus,
} from "@/lib/expert-portal";

/**
 * PATCH /api/expert/sessions/:id
 *
 *   { action: "status", status, reason? }   move a session to its outcome
 *   { action: "meeting-link", url }        set or replace the room
 *   { action: "meeting-link", url: null }  remove it
 *
 * Every branch re-reads the booking scoped to the signed-in practitioner, so
 * an id belonging to someone else's calendar is a 404, not a 403 — we do not
 * confirm that another practitioner's session exists.
 */

const CORRECTION_WINDOW_DAYS = 7;

function allowedTransition(
  from: SessionStatus,
  to: SessionStatus,
  minutesAway: number,
  closedAt: Date | null
): { ok: true } | { ok: false; error: string; status: number } {
  if (from === to) return { ok: false, error: "That is already the status.", status: 400 };

  if (from === "CANCELLED") {
    return {
      ok: false,
      error: "Cancelled sessions are final. Ask the client to book a new slot.",
      status: 409,
    };
  }

  if (to === "CANCELLED") {
    if (from !== "CONFIRMED") {
      return { ok: false, error: "Only a confirmed session can be cancelled.", status: 409 };
    }
    if (minutesAway < 0) {
      return {
        ok: false,
        error: "This session has already started. Mark it completed or a no-show instead.",
        status: 409,
      };
    }
    return { ok: true };
  }

  if (to === "COMPLETED" || to === "NO_SHOW") {
    if (from === "CONFIRMED" && minutesAway > 0) {
      return {
        ok: false,
        error: "You can record the outcome once the session has started.",
        status: 409,
      };
    }
    if (from === "COMPLETED" || from === "NO_SHOW") {
      const age = closedAt ? (Date.now() - closedAt.getTime()) / 86_400_000 : 0;
      if (age > CORRECTION_WINDOW_DAYS) {
        return {
          ok: false,
          error:
            "Outcomes can only be corrected within " +
            CORRECTION_WINDOW_DAYS +
            " days. Contact the clinical team for anything older.",
          status: 409,
        };
      }
    }
    return { ok: true };
  }

  if (to === "CONFIRMED") {
    return {
      ok: false,
      error: "A closed session cannot be reopened here. Contact the clinical team.",
      status: 409,
    };
  }

  return { ok: false, error: "That status change is not allowed.", status: 400 };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const expert = await expertIdFromSession();
  if (!expert) {
    return NextResponse.json({ error: "You need to be signed in as a practitioner." }, { status: 401 });
  }

  let body: { action?: string; status?: string; reason?: string; url?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, expertId: expert.expertId },
  });
  if (!booking) {
    return NextResponse.json({ error: "We could not find that session on your calendar." }, { status: 404 });
  }

  /* ── answering a request ─────────────────────────────────────────────
     The whole point of the request-first flow: nothing has been charged, so
     accepting opens the payment and declining simply gives the slot back. */
  if (body.action === "accept" || body.action === "decline") {
    if (booking.status !== BOOKING_STATUS.requested) {
      return NextResponse.json(
        { error: "That request has already been answered." },
        { status: 409 }
      );
    }

    const accepting = body.action === "accept";
    const reason = (body.reason ?? "").trim();
    if (!accepting && reason.length < 4) {
      return NextResponse.json(
        { error: "Add a short reason. It is for the record — the client is never shown it." },
        { status: 400 }
      );
    }

    const free = booking.amount === 0;
    const client = await prisma.user.findUniqueOrThrow({
      where: { id: booking.userId },
      select: { name: true, email: true },
    });
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: accepting
        ? {
            /* A free session has nothing to pay, so accepting it IS the
               confirmation. A paid one waits for the client to come back. */
            status: free ? BOOKING_STATUS.confirmed : BOOKING_STATUS.pendingPayment,
            holdExpiresAt: free ? null : requestExpiry(booking.date, booking.time),
          }
        : {
            status: BOOKING_STATUS.declined,
            // the slot goes straight back on the board
            slotKey: null,
            holdExpiresAt: null,
            closedAt: new Date(),
            closedBy: "EXPERT",
            closeReason: reason,
          },
    });

    /* Told, not left wondering. A request that silently changes state on a
       dashboard the client may not open for a week is the same as no answer.
       Delivery failure does not fail the decision — the practitioner has
       answered either way, and the dashboard still shows it. */
    const when = `${formatDateISO(booking.date)} at ${booking.time}`;
    const firstName = client.name.split(" ")[0] || "there";
    try {
      if (accepting) {
        await sendBookingAcceptedEmail({
          to: client.email,
          clientName: firstName,
          expertName: booking.expertName,
          when,
          link: `${site.url}/dashboard`,
          amount: booking.amount,
          free,
        });
      } else {
        await sendBookingDeclinedEmail({
          to: client.email,
          clientName: firstName,
          when,
          link: `${site.url}/book`,
        });
      }
    } catch {
      // the answer stands; only the telling of it failed
    }

    return NextResponse.json({ ok: true, status: updated.status });
  }

  /* ── outcome ─────────────────────────────────────────────────────────── */
  if (body.action === "status") {
    if (!isSessionStatus(body.status)) {
      return NextResponse.json({ error: "Unknown status." }, { status: 400 });
    }
    /* Only a session has an outcome. A request, an unpaid hold, a decline or a
       lapse used to be read as CONFIRMED here — so a declined request could be
       marked COMPLETED, pay a referral reward, and then be paid for and flipped
       back to CONFIRMED. Requests are answered with accept or decline instead. */
    if (!isSessionStatus(booking.status)) {
      return NextResponse.json(
        { error: "This is not a confirmed session yet, so it has no outcome to record." },
        { status: 409 }
      );
    }
    const from: SessionStatus = booking.status;
    const verdict = allowedTransition(
      from,
      body.status,
      sessionMinutesAway(booking),
      booking.closedAt
    );
    if (!verdict.ok) {
      return NextResponse.json({ error: verdict.error }, { status: verdict.status });
    }

    const reason = (body.reason ?? "").trim();
    if (body.status === "CANCELLED" && reason.length < 4) {
      return NextResponse.json(
        { error: "Add a short reason — the client sees a plain-language version of it." },
        { status: 400 }
      );
    }

    /* A practitioner cancelling a confirmed session goes through the same path
       as a client cancelling: the slot is released and the client gets back
       everything still held — in full, whatever the clock says, because they
       did nothing wrong. This used to set the status alone: the slot stayed
       taken forever, nothing was refunded, nobody was told, and the payout
       still paid the practitioner for the session they cancelled. */
    if (body.status === "CANCELLED") {
      const withPayment = await prisma.booking.findUniqueOrThrow({
        where: { id: booking.id },
        include: { payment: true, user: { select: { name: true, email: true } } },
      });
      const outcome = await cancelBooking({ booking: withPayment, by: "EXPERT", refund: "full", reason });
      if (!outcome.ok) {
        return NextResponse.json(
          { error: "This session changed a moment ago. Refresh to see where it stands." },
          { status: 409 }
        );
      }

      let told = true;
      try {
        const delivery = await sendSessionCancelledEmail({
          to: withPayment.user.email,
          clientName: withPayment.user.name.split(" ")[0] || "there",
          when: `${formatDateISO(booking.date)} at ${booking.time}`,
          link: `${site.url}/book`,
          refunded: outcome.refunded,
          refundPending: outcome.refundPending,
          freeSessionReturned: outcome.proBonoReturned,
        });
        told = delivery.delivered;
      } catch {
        told = false;
      }

      return NextResponse.json({
        status: outcome.booking.status,
        message: [
          "Session cancelled and the slot is free again.",
          outcome.refundPending
            ? "The refund could not be sent automatically — our team will send it."
            : outcome.refunded > 0
              ? `The client is being refunded ₹${outcome.refunded} in full.`
              : "",
          told ? "The client has been emailed." : "We could not email the client — our team will let them know.",
        ]
          .filter(Boolean)
          .join(" "),
      });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: body.status,
        closedBy: "EXPERT",
        closedAt: new Date(),
        closeReason: reason || null,
      },
    });

    // A referral is earned by attendance, not by booking. This is the moment we
    // know it happened, and the reward is idempotent, so a corrected outcome
    // that lands here twice still pays exactly once.
    if (body.status === "COMPLETED") {
      try {
        await rewardReferrerFor(booking.id);
      } catch {
        // the outcome is the important record; a missed reward is recoverable
        // by hand and must not fail the practitioner's save
      }
    }

    return NextResponse.json({
      status: updated.status,
      // cancelling returned above, through cancelBooking
      message:
        body.status === "COMPLETED"
          ? "Marked completed. It will appear on your next payout statement."
          : "Marked as a no-show. Our team reviews these before any charge.",
    });
  }

  /* ── meeting room ────────────────────────────────────────────────────── */
  if (body.action === "meeting-link") {
    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This session was cancelled, so its room cannot be changed." },
        { status: 409 }
      );
    }

    if (body.url === null || body.url === "") {
      await prisma.booking.update({ where: { id: booking.id }, data: { meetingUrl: null } });
      return NextResponse.json({
        meetingUrl: null,
        message: "Link removed. Add one before the session starts so the client can join.",
      });
    }

    if (typeof body.url !== "string") {
      return NextResponse.json({ error: "Paste the meeting link first." }, { status: 400 });
    }

    const checked = validateMeetingUrl(body.url);
    if (!checked.ok) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { meetingUrl: checked.url },
    });

    const access = meetingAccess(updated, expert.sessionMinutes);
    return NextResponse.json({
      meetingUrl: updated.meetingUrl,
      message:
        access.state === "open"
          ? "Room saved. The client can join now."
          : "Room saved. The client sees it from 15 minutes before the session.",
    });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
