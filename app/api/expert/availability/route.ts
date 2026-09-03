import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { expertIdFromSession, upcomingConfirmed } from "@/lib/expert-data";
import { clinicNow, isTime } from "@/lib/clinic-time";
import {
  MAX_BANDS_PER_DAY,
  bandCoversSession,
  overlappingBands,
  validateBand,
  type AvailabilityBand,
} from "@/lib/expert-portal";

/**
 * PUT /api/expert/availability — replaces the whole weekly grid.
 *
 * The reply carries a `conflicts` list: sessions already on the books that the
 * new grid no longer covers. Those bookings stand — a client has paid for
 * them — so this is a warning to act on, not a reason to refuse the save.
 */
export async function PUT(req: Request) {
  const expert = await expertIdFromSession();
  if (!expert) {
    return NextResponse.json({ error: "You need to be signed in as a practitioner." }, { status: 401 });
  }

  let payload: { bands?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!Array.isArray(payload.bands)) {
    return NextResponse.json({ error: "Send the week as a list of blocks." }, { status: 400 });
  }
  if (payload.bands.length > 7 * MAX_BANDS_PER_DAY) {
    return NextResponse.json({ error: "That is more blocks than a week can hold." }, { status: 400 });
  }

  const bands: AvailabilityBand[] = [];
  for (const raw of payload.bands) {
    if (typeof raw !== "object" || raw === null) {
      return NextResponse.json({ error: "One of the blocks is malformed." }, { status: 400 });
    }
    const { weekday, start, end } = raw as Record<string, unknown>;
    if (typeof weekday !== "number" || !isTime(start) || !isTime(end)) {
      return NextResponse.json({ error: "Each block needs a day, a start and a finish." }, { status: 400 });
    }
    const band = { weekday, start, end };
    const problem = validateBand(band);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    bands.push(band);
  }

  const clashes = overlappingBands(bands);
  if (clashes.length > 0) {
    const [a, b] = clashes[0];
    return NextResponse.json(
      {
        error:
          "Two blocks on the same day overlap (" +
          bands[a].start +
          "–" +
          bands[a].end +
          " and " +
          bands[b].start +
          "–" +
          bands[b].end +
          "). Merge them or move one.",
        overlaps: clashes,
      },
      { status: 409 }
    );
  }

  for (let weekday = 0; weekday < 7; weekday += 1) {
    if (bands.filter((b) => b.weekday === weekday).length > MAX_BANDS_PER_DAY) {
      return NextResponse.json(
        { error: "Keep it to " + MAX_BANDS_PER_DAY + " blocks a day so the calendar stays readable." },
        { status: 400 }
      );
    }
  }

  await prisma.$transaction([
    prisma.availabilityRule.deleteMany({ where: { expertId: expert.expertId } }),
    prisma.availabilityRule.createMany({
      data: bands.map((b) => ({ expertId: expert.expertId, weekday: b.weekday, start: b.start, end: b.end })),
    }),
  ]);

  const { date: today } = clinicNow();
  const booked = await upcomingConfirmed(expert.expertId, today);
  const conflicts = booked.filter((s) => !bandCoversSession(bands, s, expert.sessionMinutes));

  return NextResponse.json({
    bands,
    conflicts,
    message:
      bands.length === 0
        ? "Availability cleared. You will not appear in booking search until you add hours."
        : "Weekly hours saved. New bookings follow this grid from now on.",
  });
}
