import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { expertIdFromSession } from "@/lib/expert-data";
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

  /* ── outcome ─────────────────────────────────────────────────────────── */
  if (body.action === "status") {
    if (!isSessionStatus(body.status)) {
      return NextResponse.json({ error: "Unknown status." }, { status: 400 });
    }
    const from = (isSessionStatus(booking.status) ? booking.status : "CONFIRMED") as SessionStatus;
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

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: body.status,
        closedBy: "EXPERT",
        closedAt: new Date(),
        closeReason: reason || null,
      },
    });

    return NextResponse.json({
      status: updated.status,
      message:
        body.status === "COMPLETED"
          ? "Marked completed. It will appear on your next payout statement."
          : body.status === "NO_SHOW"
            ? "Marked as a no-show. Our team reviews these before any charge."
            : "Session cancelled. The client has been told, and the slot is free again.",
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
