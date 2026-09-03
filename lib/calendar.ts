import { SESSION_MINUTES, sessionStart } from "@/lib/features/booking/policy";

type CalendarBooking = {
  id: string;
  ref: string;
  expertName: string;
  date: string;
  time: string;
  meetingUrl?: string | null;
};

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function utcStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function foldLine(line: string) {
  const chunks: string[] = [];
  let remaining = line;
  while (remaining.length > 73) {
    chunks.push(remaining.slice(0, 73));
    remaining = remaining.slice(73);
  }
  chunks.push(remaining);
  return chunks.join("\r\n ");
}

export function bookingCalendar(booking: CalendarBooking, now: Date = new Date()) {
  const startsAt = sessionStart(booking.date, booking.time);
  const endsAt = new Date(startsAt.getTime() + SESSION_MINUTES * 60_000);
  const description = [
    `Emoraa therapy session with ${booking.expertName}.`,
    `Booking reference: ${booking.ref}.`,
    booking.meetingUrl ? `Join: ${booking.meetingUrl}` : "Your joining link will appear in your dashboard.",
  ].join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Emoraa//Session Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcs(booking.id)}@emoraa.in`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${utcStamp(startsAt)}`,
    `DTEND:${utcStamp(endsAt)}`,
    `SUMMARY:${escapeIcs(`Session with ${booking.expertName}`)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    ...(booking.meetingUrl
      ? [`LOCATION:${escapeIcs(booking.meetingUrl)}`, `URL:${escapeIcs(booking.meetingUrl)}`]
      : []),
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Your Emoraa session starts in 30 minutes.",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}