import {
  addDays,
  addMinutes,
  minutesUntil,
  timeToMinutes,
  timesOverlap,
  weekdayOf,
} from "@/lib/clinic-time";
import { durationMinutesFor } from "@/lib/services";

/* ────────────────────────────────────────────────────────────────────────────
   Session status
   ──────────────────────────────────────────────────────────────────────────── */

export const SESSION_STATUSES = ["CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELLED"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export type StatusMeta = {
  label: string;
  /** Badge classes. Never colour-only — the label always carries the meaning. */
  tone: string;
  hint: string;
};

export const STATUS_META: Record<SessionStatus, StatusMeta> = {
  CONFIRMED: {
    label: "Confirmed",
    tone: "bg-sage-light/70 text-forest-800 ring-1 ring-inset ring-forest-800/15",
    hint: "Booked and paid for. Nothing more to do until it starts.",
  },
  COMPLETED: {
    label: "Completed",
    tone: "bg-mor/10 text-mor-ink ring-1 ring-inset ring-mor/25",
    hint: "The session happened. It counts towards your payout.",
  },
  NO_SHOW: {
    label: "No-show",
    tone: "bg-haldi/15 text-haldi-ink ring-1 ring-inset ring-haldi/35",
    hint: "The client did not join. Our team reviews these before any charge.",
  },
  CANCELLED: {
    label: "Cancelled",
    tone: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
    hint: "Called off. The slot is released back to your calendar.",
  },
};

/**
 * Every status a booking can show a practitioner, including the ones they do
 * not set themselves.
 *
 * `SESSION_STATUSES` above is the list of *outcomes* a practitioner records,
 * and `isSessionStatus` guards that action — REQUESTED is not an outcome and
 * must never be settable through it. This map is for reading: the board, the
 * table and the cards all need to render a request or a decline.
 *
 * Yellow waiting, green agreed, red not happening. The colour is never the
 * only carrier — each one has a label, because a colour alone is unreadable
 * to anyone who cannot distinguish these two, and meaningless in a screen
 * reader.
 */
export const BOOKING_STATUS_META: Record<string, StatusMeta> = {
  ...STATUS_META,
  REQUESTED: {
    label: "Pending",
    tone: "bg-haldi/20 text-haldi-ink ring-1 ring-inset ring-haldi/45",
    hint: "Waiting on you. The slot is held and nothing has been charged.",
  },
  PENDING_PAYMENT: {
    label: "Accepted · awaiting payment",
    tone: "bg-haldi/15 text-haldi-ink ring-1 ring-inset ring-haldi/35",
    hint: "You said yes. It is confirmed once the client pays.",
  },
  DECLINED: {
    label: "Declined",
    tone: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
    hint: "You did not take this one. The slot went back on your calendar.",
  },
  EXPIRED: {
    label: "Lapsed",
    tone: "bg-forest-800/[0.06] text-ink/70 ring-1 ring-inset ring-forest-800/10",
    hint: "Nobody answered in time, so the slot was released.",
  },
};

export function statusMeta(status: string): StatusMeta {
  return (
    BOOKING_STATUS_META[status] ?? {
      label: status,
      tone: "bg-forest-800/[0.06] text-ink/70 ring-1 ring-inset ring-forest-800/10",
      hint: "",
    }
  );
}

/**
 * Every status a booking can be *in*, as opposed to the outcomes a
 * practitioner can *set*. A view has to render all of them; only
 * `SessionStatus` may be written through the status action.
 */
export type ViewStatus = SessionStatus | "REQUESTED" | "DECLINED" | "PENDING_PAYMENT" | "EXPIRED";

export function isSessionStatus(v: unknown): v is SessionStatus {
  return typeof v === "string" && (SESSION_STATUSES as readonly string[]).includes(v);
}

/* ────────────────────────────────────────────────────────────────────────────
   Where a session sits in time
   ──────────────────────────────────────────────────────────────────────────── */

export const JOIN_OPENS_MINUTES_BEFORE = 15;
export const JOIN_CLOSES_MINUTES_AFTER = 30;

export type SessionPhase = "soon" | "live" | "later" | "past";

export type TimedSession = {
  date: string;
  time: string;
  status: string;
  meetingUrl?: string | null;
  /** What was booked. Absent on sessions taken before the service was stored. */
  serviceSlug?: string | null;
};

/**
 * How long this session runs.
 *
 * The service decides, because the service is what was sold: 30 minutes for a
 * psychiatry consultation, 90 for a group. The practitioner's own
 * `sessionMinutes` is only the fallback, for bookings made before the service
 * was recorded on them.
 *
 * Everything below — when a session reads as finished, when the room shuts —
 * used to run off that flat fallback alone. At 50 minutes for everybody, a
 * 90-minute group was marked "past" forty minutes early and its room closed
 * ten minutes before the group did.
 */
export function sessionLength(s: TimedSession, fallbackMinutes: number): number {
  return (s.serviceSlug ? durationMinutesFor(s.serviceSlug) : null) ?? fallbackMinutes;
}

export function sessionMinutesAway(s: TimedSession, now: Date = new Date()) {
  return minutesUntil(s.date, s.time, now);
}

export function sessionPhase(
  s: TimedSession,
  sessionMinutes: number,
  now: Date = new Date()
): SessionPhase {
  const away = sessionMinutesAway(s, now);
  if (away <= -sessionLength(s, sessionMinutes)) return "past";
  if (away <= 0) return "live";
  if (away <= JOIN_OPENS_MINUTES_BEFORE) return "soon";
  return "later";
}

/** Only CONFIRMED sessions that have not finished are actionable "upcoming". */
export function isUpcoming(s: TimedSession, sessionMinutes: number, now: Date = new Date()) {
  return s.status === "CONFIRMED" && sessionPhase(s, sessionMinutes, now) !== "past";
}

/* ────────────────────────────────────────────────────────────────────────────
   Meeting-link access

   The room is not a permanent URL the practitioner can hand around: it opens
   fifteen minutes before the hour and closes thirty minutes after the session
   should have ended. Everything else is a deliberate, explained refusal.
   ──────────────────────────────────────────────────────────────────────────── */

export type MeetingAccess =
  | { state: "open"; url: string; closesInMinutes: number }
  | { state: "early"; opensInMinutes: number }
  | { state: "closed" }
  | { state: "missing" }
  | { state: "unavailable"; reason: string };

export function meetingAccess(
  s: TimedSession,
  sessionMinutes: number,
  now: Date = new Date()
): MeetingAccess {
  if (s.status === "CANCELLED") {
    return { state: "unavailable", reason: "This session was cancelled, so the room is closed." };
  }
  if (s.status === "NO_SHOW") {
    return { state: "unavailable", reason: "Marked as a no-show — the room has been released." };
  }
  const away = sessionMinutesAway(s, now);
  const closesIn = away + sessionLength(s, sessionMinutes) + JOIN_CLOSES_MINUTES_AFTER;
  if (closesIn <= 0) return { state: "closed" };
  if (away > JOIN_OPENS_MINUTES_BEFORE) {
    return { state: "early", opensInMinutes: away - JOIN_OPENS_MINUTES_BEFORE };
  }
  if (!s.meetingUrl) return { state: "missing" };
  return { state: "open", url: s.meetingUrl, closesInMinutes: closesIn };
}

/** Rejects anything that is not an https meeting room we recognise. */
const MEETING_HOSTS = [
  "meet.google.com",
  "zoom.us",
  "teams.microsoft.com",
  "teams.live.com",
  "whereby.com",
  "meet.jit.si",
  "daily.co",
  "emoraa.com",
];

export function validateMeetingUrl(
  raw: string
): { ok: true; url: string } | { ok: false; error: string } {
  const value = raw.trim();
  if (!value) return { ok: false, error: "Paste the meeting link first." };
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, error: "That is not a full link — it should start with https://" };
  }
  if (parsed.protocol !== "https:") {
    return { ok: false, error: "Meeting links must use https:// so the room stays encrypted." };
  }
  const host = parsed.hostname.replace(/^www\./, "");
  const allowed = MEETING_HOSTS.some((h) => host === h || host.endsWith("." + h));
  if (!allowed) {
    return {
      ok: false,
      error:
        "We only accept rooms on " +
        MEETING_HOSTS.slice(0, 4).join(", ") +
        " and similar approved platforms.",
    };
  }
  return { ok: true, url: parsed.toString() };
}

export function meetingHostLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "meeting room";
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   Privacy boundary

   An expert needs enough to recognise who is joining and to prepare for the
   conversation. They do not need a client's full email, phone number, other
   bookings, or anything about sessions with other practitioners. This mapper
   is the only shape that reaches the expert portal's UI, and WITHHELD_FROM_
   EXPERTS is rendered on screen so the boundary is visible rather than implied.
   ──────────────────────────────────────────────────────────────────────────── */

export type ClientSafeClient = {
  displayName: string;
  /** Their actual name, shown on the session itself. */
  fullName: string;
  initials: string;
  age: number | null;
  gender: string | null;
  /** The language they said they would rather talk in, if any. */
  language: string | null;
  /** Their own picture, if they set one. Served by a route that checks you
      have a booking with them — so it renders with a plain <img>, never
      next/image, whose optimiser fetches without the session cookie. */
  avatar: string | null;
  maskedEmail: string;
  sessionsWithYou: number;
  isReturning: boolean;
  clientSince: string;
};

export function displayName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Client";
  if (parts.length === 1) return parts[0];
  return parts[0] + " " + parts[parts.length - 1][0].toUpperCase() + ".";
}

export function initialsOf(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** "ay•••••@gmail.com" — enough to match a name to an inbox, not to mail it. */
export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return "•••";
  const head = local.slice(0, 2);
  const dots = "•".repeat(Math.max(3, Math.min(8, local.length - 2)));
  return head + dots + "@" + domain;
}

export const WITHHELD_FROM_EXPERTS = [
  "Full email address and phone number",
  "Payment method and billing history",
  "Sessions booked with other practitioners",
  "Entries from the free self-help tools and mood check-ins",
];

/* ────────────────────────────────────────────────────────────────────────────
   Notes policy
   ──────────────────────────────────────────────────────────────────────────── */

export const NOTES_POLICIES = ["APPROVED", "PENDING", "BLOCKED"] as const;
export type NotesPolicy = (typeof NOTES_POLICIES)[number];

export function isNotesPolicy(v: unknown): v is NotesPolicy {
  return typeof v === "string" && (NOTES_POLICIES as readonly string[]).includes(v);
}

export const NOTES_POLICY_COPY: Record<NotesPolicy, { label: string; short: string; body: string }> = {
  APPROVED: {
    label: "Note-keeping enabled",
    short: "Enabled",
    body: "Your practice is cleared to keep session notes here. A note is visible to you and to our clinical governance lead — never to the client, and never to another practitioner.",
  },
  PENDING: {
    label: "Note-keeping pending approval",
    short: "Pending approval",
    body: "Notes stay switched off until your data-handling agreement is countersigned. Until then please keep records in your own secure, compliant system. Nothing typed here would be stored, so we do not offer the field at all.",
  },
  BLOCKED: {
    label: "Note-keeping held elsewhere",
    short: "Held in your own system",
    body: "Clinical records for your practice live in your organisation's own system, so this portal deliberately has nowhere to type them. Talk to your governance lead if that looks wrong.",
  },
};

export function canWriteNotes(policy: string): policy is "APPROVED" {
  return policy === "APPROVED";
}

export const MAX_NOTE = 4000;

/* ────────────────────────────────────────────────────────────────────────────
   Availability and time off
   ──────────────────────────────────────────────────────────────────────────── */

export type AvailabilityBand = { id?: string; weekday: number; start: string; end: string };

export type TimeOffBlock = {
  id?: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
};

export const MIN_BAND_MINUTES = 30;
export const MAX_BANDS_PER_DAY = 4;

export function validateBand(band: AvailabilityBand): string | null {
  if (!Number.isInteger(band.weekday) || band.weekday < 0 || band.weekday > 6) {
    return "Pick a day of the week.";
  }
  const start = timeToMinutes(band.start);
  const end = timeToMinutes(band.end);
  if (end <= start) return "The finish time has to be after the start time.";
  if (end - start < MIN_BAND_MINUTES) {
    return "A block needs to be at least " + MIN_BAND_MINUTES + " minutes long.";
  }
  return null;
}

/** Bands on the same weekday that collide, as pairs of indexes. */
export function overlappingBands(bands: AvailabilityBand[]) {
  const clashes: Array<[number, number]> = [];
  bands.forEach((a, i) => {
    bands.slice(i + 1).forEach((b, j) => {
      if (a.weekday === b.weekday && timesOverlap(a.start, a.end, b.start, b.end)) {
        clashes.push([i, i + 1 + j]);
      }
    });
  });
  return clashes;
}

export function bandCoversSession(
  bands: AvailabilityBand[],
  s: { date: string; time: string },
  sessionMinutes: number
) {
  const weekday = weekdayOf(s.date);
  const end = addMinutes(s.time, sessionMinutes);
  return bands.some(
    (b) =>
      b.weekday === weekday &&
      timeToMinutes(b.start) <= timeToMinutes(s.time) &&
      timeToMinutes(b.end) >= timeToMinutes(end)
  );
}

export function timeOffCoversSession(
  block: TimeOffBlock,
  s: { date: string; time: string },
  sessionMinutes: number
) {
  if (s.date < block.startDate || s.date > block.endDate) return false;
  if (block.allDay || !block.startTime || !block.endTime) return true;
  return timesOverlap(block.startTime, block.endTime, s.time, addMinutes(s.time, sessionMinutes));
}

export function validateTimeOff(block: TimeOffBlock, today: string): string | null {
  if (block.endDate < block.startDate) return "The last day cannot be before the first day.";
  if (block.endDate < today) return "That block is entirely in the past.";
  if (addDays(block.startDate, 365) < block.endDate) return "Keep a single block under a year.";
  if (!block.allDay) {
    if (!block.startTime || !block.endTime) {
      return "Add the hours you are away, or make it an all-day block.";
    }
    if (timeToMinutes(block.endTime) <= timeToMinutes(block.startTime)) {
      return "The finish time has to be after the start time.";
    }
    if (block.startDate !== block.endDate) {
      return "Part-day blocks cover a single date. Use all-day for a longer stretch.";
    }
  }
  return null;
}

/** Bookable hours a week, for the availability summary. */
export function weeklyHours(bands: AvailabilityBand[]) {
  const minutes = bands.reduce(
    (sum, b) => sum + (timeToMinutes(b.end) - timeToMinutes(b.start)),
    0
  );
  return Math.round((minutes / 60) * 10) / 10;
}

/* ────────────────────────────────────────────────────────────────────────────
   Profile vocabulary
   ──────────────────────────────────────────────────────────────────────────── */

export const SPECIALTY_OPTIONS = [
  "Anxiety",
  "Panic attacks",
  "Depression",
  "Workplace stress",
  "Burnout",
  "Career anxiety",
  "Student stress",
  "Exam anxiety",
  "Relationships",
  "Couples therapy",
  "Family expectations",
  "Parenting",
  "Grief",
  "Trauma",
  "Self-esteem",
  "Sleep",
  "Life transitions",
  "Women's mental health",
  "Men's mental health",
  "LGBTQ+ affirmative care",
  "Mindfulness-based therapy",
  "Habits and addiction",
];

export const LANGUAGE_OPTIONS = [
  "English",
  "Hindi",
  "Bengali",
  "Marathi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Gujarati",
  "Punjabi",
  "Urdu",
  "Odia",
  "Assamese",
];

/** Zones we support on a profile. A short, checkable list beats free text. */
export const TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "India — IST (clinic default)" },
  { value: "Asia/Dubai", label: "Gulf — GST" },
  { value: "Asia/Singapore", label: "Singapore — SGT" },
  { value: "Europe/London", label: "UK — GMT/BST" },
  { value: "Europe/Berlin", label: "Central Europe — CET/CEST" },
  { value: "America/New_York", label: "US East — ET" },
  { value: "America/Los_Angeles", label: "US West — PT" },
  { value: "Australia/Sydney", label: "Australia East — AET" },
];

export function isSupportedTimezone(value: unknown): value is string {
  return typeof value === "string" && TIMEZONE_OPTIONS.some((t) => t.value === value);
}

export const MAX_SPECIALTIES = 6;
export const MAX_LANGUAGES = 5;
export const MAX_BIO = 900;
export const MAX_HEADLINE = 120;

/** SQLite has no scalar lists, so these two live as JSON text. */
export function parseList(json: string): string[] {
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function stringifyList(values: string[]) {
  return JSON.stringify(Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))));
}

/* ────────────────────────────────────────────────────────────────────────────
   Notification preferences
   ──────────────────────────────────────────────────────────────────────────── */

export const NOTIFY_CHANNELS = ["EMAIL", "WHATSAPP", "BOTH"] as const;
export type NotifyChannel = (typeof NOTIFY_CHANNELS)[number];

export function isNotifyChannel(v: unknown): v is NotifyChannel {
  return typeof v === "string" && (NOTIFY_CHANNELS as readonly string[]).includes(v);
}

export const REMINDER_LEADS = [15, 30, 60, 120, 1440];

export function reminderLeadLabel(minutes: number) {
  if (minutes >= 1440) return "A day before";
  if (minutes >= 60) return minutes / 60 + " hour" + (minutes === 60 ? "" : "s") + " before";
  return minutes + " minutes before";
}
