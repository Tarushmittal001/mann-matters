import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isTime } from "@/lib/clinic-time";
import { REMINDER_LEADS, isNotifyChannel } from "@/lib/expert-portal";

/**
 * PATCH /api/expert/notifications
 *
 * Booking and cancellation alerts are not optional — a practitioner who does
 * not know a session was booked cannot show up for it — so those two are
 * accepted only as `true`. Everything else is genuinely a preference.
 */
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "EXPERT" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "You need to be signed in as a practitioner." }, { status: 401 });
  }

  const profile = await prisma.expertProfile.findUnique({ where: { userId: session.sub } });
  if (!profile) {
    return NextResponse.json({ error: "Your practitioner record is not linked yet." }, { status: 404 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const bool = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback);

  const lead = Number(payload.reminderLeadMinutes);
  if (!REMINDER_LEADS.includes(lead)) {
    return NextResponse.json({ error: "Pick a reminder time from the list." }, { status: 400 });
  }

  if (!isNotifyChannel(payload.channel)) {
    return NextResponse.json({ error: "Pick email, WhatsApp, or both." }, { status: 400 });
  }

  const quietEnabled = bool(payload.quietHoursEnabled, profile.quietHoursEnabled);
  const quietStart = payload.quietHoursStart;
  const quietEnd = payload.quietHoursEnd;

  if (quietEnabled && (!isTime(quietStart) || !isTime(quietEnd))) {
    return NextResponse.json({ error: "Quiet hours need a start and an end time." }, { status: 400 });
  }
  if (quietEnabled && quietStart === quietEnd) {
    return NextResponse.json(
      { error: "Quiet hours that start and end at the same minute would silence everything." },
      { status: 400 }
    );
  }

  const updated = await prisma.expertProfile.update({
    where: { id: profile.id },
    data: {
      // kept on deliberately: see the note at the top of this file
      notifyNewBooking: true,
      notifyCancellation: true,
      notifyReminder: bool(payload.reminder, profile.notifyReminder),
      reminderLeadMinutes: lead,
      notifyWeeklyDigest: bool(payload.weeklyDigest, profile.notifyWeeklyDigest),
      notifyProductUpdates: bool(payload.productUpdates, profile.notifyProductUpdates),
      notifyChannel: payload.channel,
      quietHoursEnabled: quietEnabled,
      ...(quietEnabled ? { quietHoursStart: quietStart as string, quietHoursEnd: quietEnd as string } : {}),
    },
  });

  return NextResponse.json({
    updatedAt: updated.updatedAt.toISOString(),
    message: "Notification preferences saved.",
  });
}
