import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { expertIdFromSession, upcomingConfirmed } from "@/lib/expert-data";
import { clinicNow, isDate, isTime } from "@/lib/clinic-time";
import { timeOffCoversSession, validateTimeOff, type TimeOffBlock } from "@/lib/expert-portal";

const MAX_REASON = 160;

/**
 * POST /api/expert/time-off — book a stretch of unavailability.
 *
 * If the block lands on sessions that are already confirmed we refuse with 409
 * and hand back the list. The practitioner then either picks different dates or
 * re-sends with `acknowledge: true`, which saves the block and flags those
 * sessions for rescheduling. Silently swallowing a clash would strand a client.
 */
export async function POST(req: Request) {
  const expert = await expertIdFromSession();
  if (!expert) {
    return NextResponse.json({ error: "You need to be signed in as a practitioner." }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { startDate, endDate, allDay, startTime, endTime, reason, acknowledge } = payload;

  if (!isDate(startDate) || !isDate(endDate)) {
    return NextResponse.json({ error: "Pick a first and last day for the block." }, { status: 400 });
  }
  const isAllDay = allDay !== false;
  if (!isAllDay && (!isTime(startTime) || !isTime(endTime))) {
    return NextResponse.json(
      { error: "Add the hours you are away, or make it an all-day block." },
      { status: 400 }
    );
  }
  if (typeof reason === "string" && reason.length > MAX_REASON) {
    return NextResponse.json({ error: "Keep the reason under " + MAX_REASON + " characters." }, { status: 400 });
  }

  const block: TimeOffBlock = {
    startDate,
    endDate,
    allDay: isAllDay,
    startTime: isAllDay ? null : (startTime as string),
    endTime: isAllDay ? null : (endTime as string),
  };

  const { date: today } = clinicNow();
  const problem = validateTimeOff(block, today);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const booked = await upcomingConfirmed(expert.expertId, today);
  const conflicts = booked.filter((s) => timeOffCoversSession(block, s, expert.sessionMinutes));

  if (conflicts.length > 0 && acknowledge !== true) {
    return NextResponse.json(
      {
        error:
          conflicts.length === 1
            ? "One confirmed session sits inside those dates."
            : conflicts.length + " confirmed sessions sit inside those dates.",
        conflicts,
        needsAcknowledgement: true,
      },
      { status: 409 }
    );
  }

  const created = await prisma.timeOff.create({
    data: {
      expertId: expert.expertId,
      startDate: block.startDate,
      endDate: block.endDate,
      allDay: block.allDay,
      startTime: block.startTime ?? null,
      endTime: block.endTime ?? null,
      reason: typeof reason === "string" ? reason.trim() : "",
    },
  });

  return NextResponse.json({
    block: {
      id: created.id,
      startDate: created.startDate,
      endDate: created.endDate,
      allDay: created.allDay,
      startTime: created.startTime,
      endTime: created.endTime,
      reason: created.reason,
    },
    conflicts,
    message:
      conflicts.length > 0
        ? "Time off saved. Reschedule or cancel the " +
          conflicts.length +
          " session" +
          (conflicts.length === 1 ? "" : "s") +
          " inside it."
        : "Time off saved. Those dates are closed to new bookings.",
  });
}
