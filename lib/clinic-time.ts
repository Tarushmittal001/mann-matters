/**
 * Every session in the system is stored as a clinic-local wall clock — a
 * `YYYY-MM-DD` date and an `HH:mm` time, both IST. That keeps the booking grid
 * stable no matter where the practitioner or the client happens to be sitting,
 * but it means the UI has to be loud about which clock it is quoting. These
 * helpers are the only place that conversion happens.
 */

export const CLINIC_TZ = "Asia/Kolkata";
export const CLINIC_TZ_LABEL = "IST";
/** India has no DST, so a fixed offset is exact rather than a shortcut. */
export const CLINIC_UTC_OFFSET = "+05:30";

export const WEEKDAYS = [
  { index: 0, short: "Sun", long: "Sunday" },
  { index: 1, short: "Mon", long: "Monday" },
  { index: 2, short: "Tue", long: "Tuesday" },
  { index: 3, short: "Wed", long: "Wednesday" },
  { index: 4, short: "Thu", long: "Thursday" },
  { index: 5, short: "Fri", long: "Friday" },
  { index: 6, short: "Sat", long: "Saturday" },
] as const;

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isDate(v: unknown): v is string {
  return typeof v === "string" && DATE_RE.test(v) && !Number.isNaN(Date.parse(v));
}

export function isTime(v: unknown): v is string {
  return typeof v === "string" && TIME_RE.test(v);
}

/** The clinic's own wall clock right now. */
export function clinicNow(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  // en-CA gives 24-hour time but renders midnight as "24"
  const hour = get("hour") === "24" ? "00" : get("hour");

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${hour}:${get("minute")}`,
  };
}

/** Absolute instant of a clinic-local wall clock. */
export function toEpoch(date: string, time: string) {
  return Date.parse(`${date}T${time}:00${CLINIC_UTC_OFFSET}`);
}

/** Signed minutes from `now` until that wall clock. Negative = already past. */
export function minutesUntil(date: string, time: string, now: Date = new Date()) {
  return Math.round((toEpoch(date, time) - now.getTime()) / 60000);
}

export function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number) {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addMinutes(time: string, minutes: number) {
  return minutesToTime(timeToMinutes(time) + minutes);
}

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday, for a clinic-local date. */
export function weekdayOf(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** Monday-first start of the week containing `date`. */
export function startOfWeek(date: string) {
  const wd = weekdayOf(date);
  return addDays(date, wd === 0 ? -6 : 1 - wd);
}

/** "6:30 pm" — no zone label, for when the caller adds its own. */
export function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "6:30 pm IST" — the default, because an unlabelled time is a bug. */
export function formatClinicTime(time: string) {
  return `${formatTime(time)} ${CLINIC_TZ_LABEL}`;
}

export function formatTimeRange(start: string, end: string) {
  return `${formatTime(start)} – ${formatTime(end)} ${CLINIC_TZ_LABEL}`;
}

/** "Sat, 30 Aug 2026" */
export function formatDate(date: string, opts?: { year?: boolean }) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(opts?.year === false ? {} : { year: "numeric" }),
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

/** "30 Aug" — for places that already show the weekday separately. */
export function formatDayMonth(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

/** "Today" / "Tomorrow" / "Sat, 30 Aug" — relative to the clinic's date. */
export function relativeDay(date: string, today: string) {
  if (date === today) return "Today";
  if (date === addDays(today, 1)) return "Tomorrow";
  if (date === addDays(today, -1)) return "Yesterday";
  return formatDate(date, { year: date.slice(0, 4) !== today.slice(0, 4) });
}

/** "in 25 min" / "3 hours ago" / "in 4 days" */
export function humanGap(minutes: number) {
  const abs = Math.abs(minutes);
  const value =
    abs < 60
      ? `${abs} min`
      : abs < 60 * 24
        ? `${Math.round(abs / 60)} hr${Math.round(abs / 60) === 1 ? "" : "s"}`
        : `${Math.round(abs / (60 * 24))} day${Math.round(abs / (60 * 24)) === 1 ? "" : "s"}`;
  return minutes >= 0 ? `in ${value}` : `${value} ago`;
}

/** The viewer's own zone, for the timezone banner. Browser-only. */
export function deviceZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/** Current offset of `zone` against the clinic, in minutes. */
export function offsetFromClinic(zone: string, now: Date = new Date()) {
  const read = (tz: string) => {
    const p = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const g = (t: Intl.DateTimeFormatPartTypes) => Number(p.find((x) => x.type === t)?.value ?? 0);
    return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"));
  };
  try {
    return Math.round((read(zone) - read(CLINIC_TZ)) / 60000);
  } catch {
    return 0;
  }
}

/** "+2:30" / "−5:30" / "same clock" */
export function offsetLabel(minutes: number) {
  if (minutes === 0) return "same clock";
  const sign = minutes > 0 ? "+" : "−";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""} hr`;
}

/** The same instant, written on another zone's clock. */
export function inZone(date: string, time: string, zone: string) {
  try {
    const fmt = new Intl.DateTimeFormat("en-IN", {
      timeZone: zone,
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return fmt.format(new Date(toEpoch(date, time)));
  } catch {
    return null;
  }
}

/** Do [aStart,aEnd) and [bStart,bEnd) overlap? Times are HH:mm. */
export function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd);
}
