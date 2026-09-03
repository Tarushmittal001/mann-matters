import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { expertIdFromSession } from "@/lib/expert-data";
import { canWriteNotes, MAX_NOTE, sessionMinutesAway } from "@/lib/expert-portal";

/**
 * Session notes. Two gates sit in front of every write:
 *
 *   1. Policy. `notesPolicy` must be APPROVED. This is set by clinical
 *      governance, never by the practitioner, so the check lives server-side
 *      and the UI simply never renders the field otherwise.
 *   2. Time. A note belongs to a session that has actually started.
 *
 * Once submitted a note is immutable; corrections are appended as amendments
 * so the record keeps its history.
 */

type NoteBody = { action?: "save" | "submit" | "amend"; body?: string };

async function loadContext(bookingId: string) {
  const expert = await expertIdFromSession();
  if (!expert) {
    return {
      error: NextResponse.json(
        { error: "You need to be signed in as a practitioner." },
        { status: 401 }
      ),
    } as const;
  }

  if (!canWriteNotes(expert.notesPolicy)) {
    return {
      error: NextResponse.json(
        {
          error:
            "Note-keeping is not enabled for your practice, so nothing can be saved here.",
        },
        { status: 403 }
      ),
    } as const;
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, expertId: expert.expertId },
  });
  if (!booking) {
    return {
      error: NextResponse.json(
        { error: "We could not find that session on your calendar." },
        { status: 404 }
      ),
    } as const;
  }

  if (sessionMinutesAway(booking) > 0) {
    return {
      error: NextResponse.json(
        { error: "You can start a note once the session has begun." },
        { status: 409 }
      ),
    } as const;
  }

  if (booking.status === "CANCELLED") {
    return {
      error: NextResponse.json(
        { error: "This session was cancelled, so it has no clinical record." },
        { status: 409 }
      ),
    } as const;
  }

  const note = await prisma.sessionNote.findUnique({ where: { bookingId: booking.id } });
  return { expert, booking, note } as const;
}

function checkLength(text: string) {
  if (text.trim().length === 0) return "There is nothing to save yet.";
  if (text.length > MAX_NOTE) {
    return "Notes are capped at " + MAX_NOTE + " characters. Trim it and save again.";
  }
  return null;
}

/** Save or replace the draft. */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const ctx = await loadContext(params.id);
  if ("error" in ctx) return ctx.error;

  let payload: NoteBody;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const text = (payload.body ?? "").replace(/\r\n/g, "\n");
  const problem = checkLength(text);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  if (ctx.note?.status === "SUBMITTED") {
    return NextResponse.json(
      { error: "This note is submitted and locked. Add an amendment instead." },
      { status: 409 }
    );
  }

  const saved = await prisma.sessionNote.upsert({
    where: { bookingId: ctx.booking.id },
    create: {
      bookingId: ctx.booking.id,
      expertId: ctx.expert.expertId,
      body: text,
      status: "DRAFT",
    },
    update: { body: text },
  });

  return NextResponse.json({
    note: { status: saved.status, updatedAt: saved.updatedAt.toISOString() },
    message: "Draft saved. Only you and clinical governance can read it.",
  });
}

/** Submit the draft, or amend an already-submitted note. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = await loadContext(params.id);
  if ("error" in ctx) return ctx.error;

  let payload: NoteBody;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (payload.action === "amend") {
    if (!ctx.note || ctx.note.status !== "SUBMITTED") {
      return NextResponse.json(
        { error: "Only a submitted note can be amended." },
        { status: 409 }
      );
    }
    const text = (payload.body ?? "").replace(/\r\n/g, "\n");
    const problem = checkLength(text);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });

    const amendment = await prisma.noteAmendment.create({
      data: { noteId: ctx.note.id, body: text },
    });

    return NextResponse.json({
      amendment: { id: amendment.id, createdAt: amendment.createdAt.toISOString() },
      message: "Amendment added. The original note stays exactly as it was submitted.",
    });
  }

  /* submit */
  const text = (payload.body ?? ctx.note?.body ?? "").replace(/\r\n/g, "\n");
  const problem = checkLength(text);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  if (ctx.note?.status === "SUBMITTED") {
    return NextResponse.json({ error: "This note has already been submitted." }, { status: 409 });
  }

  const saved = await prisma.sessionNote.upsert({
    where: { bookingId: ctx.booking.id },
    create: {
      bookingId: ctx.booking.id,
      expertId: ctx.expert.expertId,
      body: text,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
    update: { body: text, status: "SUBMITTED", submittedAt: new Date() },
  });

  return NextResponse.json({
    note: {
      status: saved.status,
      submittedAt: saved.submittedAt?.toISOString() ?? null,
      updatedAt: saved.updatedAt.toISOString(),
    },
    message: "Note submitted and locked. Corrections go in as amendments from here.",
  });
}
