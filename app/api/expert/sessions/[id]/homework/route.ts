import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { expertIdFromSession } from "@/lib/expert-data";
import { MAX_SHORT, MAX_TASK, MAX_WHY, validateHomework } from "@/lib/homework";

export const dynamic = "force-dynamic";

/**
 * POST   /api/expert/sessions/:id/homework   { task, why?, frequency?, duration?, dueOn? }
 * DELETE /api/expert/sessions/:id/homework   { homeworkId }
 *
 * Both re-read the booking scoped to the signed-in practitioner first, so an
 * id from somebody else's calendar is a 404 rather than a 403 — we do not
 * confirm that another practitioner's session exists.
 *
 * There is no edit. A task the client has already read and acted on should not
 * change under them; delete it and set a clearer one.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const expert = await expertIdFromSession();
  if (!expert) {
    return NextResponse.json({ error: "You need to be signed in as a practitioner." }, { status: 401 });
  }

  let body: {
    task?: string;
    why?: string;
    frequency?: string;
    duration?: string;
    dueOn?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, expertId: expert.expertId },
    select: { id: true, userId: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "We could not find that session on your calendar." }, { status: 404 });
  }

  const task = String(body.task ?? "").trim().slice(0, MAX_TASK);
  const why = String(body.why ?? "").trim().slice(0, MAX_WHY);
  /* How often and for how long. Optional — "notice when you snap at
     someone" has no frequency — but when they are given they turn a
     suggestion into something a person can actually follow. */
  const frequency = String(body.frequency ?? "").trim().slice(0, MAX_SHORT);
  const duration = String(body.duration ?? "").trim().slice(0, MAX_SHORT);

  const fields = validateHomework(task, why);
  if (Object.keys(fields).length) {
    return NextResponse.json({ fields, error: Object.values(fields)[0] }, { status: 422 });
  }

  const dueOn =
    typeof body.dueOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.dueOn) ? body.dueOn : null;

  // Two or three things is a practice; eight is a reason to give up before
  // starting. The cap is a clinical judgement, not a storage one.
  const existing = await prisma.homework.count({ where: { bookingId: booking.id } });
  if (existing >= 5) {
    return NextResponse.json(
      { error: "Five is plenty for one session. Remove one before adding another." },
      { status: 409 }
    );
  }

  const created = await prisma.homework.create({
    data: {
      bookingId: booking.id,
      userId: booking.userId,
      expertId: expert.expertId,
      task,
      why,
      frequency,
      duration,
      dueOn,
    },
  });

  return NextResponse.json({
    homework: {
      id: created.id,
      task: created.task,
      frequency: created.frequency,
      duration: created.duration,
      why: created.why,
      dueOn: created.dueOn,
      doneAt: null,
    },
  });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const expert = await expertIdFromSession();
  if (!expert) {
    return NextResponse.json({ error: "You need to be signed in as a practitioner." }, { status: 401 });
  }

  let body: { homeworkId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { count } = await prisma.homework.deleteMany({
    where: { id: String(body.homeworkId ?? ""), bookingId: params.id, expertId: expert.expertId },
  });
  if (count === 0) {
    return NextResponse.json({ error: "That task no longer exists." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
