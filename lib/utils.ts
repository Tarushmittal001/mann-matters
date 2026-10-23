export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatINR(value: number) {
  return "₹" + value.toLocaleString("en-IN");
}

export function formatDateISO(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * The name to greet somebody by.
 *
 * `name.split(" ")[0]` is the obvious version and it greets half the
 * practitioners on this site as "Dr." — a title is not a name, and being
 * addressed by one reads as a mail merge that went wrong. Honorifics are
 * skipped until an actual name turns up.
 *
 *   "Dr. Nandini Rao"  -> "Nandini"
 *   "Prof Arjun Mehta" -> "Arjun"
 *   "Ananya Iyer"      -> "Ananya"
 *   "Dr."              -> ""        (nothing safe to say — callers omit the greeting)
 */
const HONORIFICS = new Set([
  "dr", "dr.", "doctor", "prof", "prof.", "professor",
  "mr", "mr.", "mrs", "mrs.", "ms", "ms.", "miss", "mx", "mx.",
  "shri", "smt", "smt.", "sri",
]);

export function firstNameOf(fullName: string): string {
  for (const part of fullName.trim().split(/\s+/)) {
    if (!part) continue;
    if (HONORIFICS.has(part.toLowerCase())) continue;
    return part;
  }
  return "";
}
