import { DATE_RE } from "@/lib/validation";
import { istDateOffset, todayIST } from "@/lib/features/booking/policy";

/**
 * The time filter, for every admin screen that has one.
 *
 * Presets answer the usual question in one click; a custom range answers the
 * one a preset cannot — a board meeting, a quarter, the fortnight a campaign
 * ran. Both resolve to the same thing: a pair of `YYYY-MM-DD` dates in clinic
 * time. Nothing downstream needs to know which the admin used.
 *
 * ── WHY THE RANGE IS A PAIR OF DATE STRINGS ────────────────────────────────
 * Bookings store `date` as a `YYYY-MM-DD` in IST, so a filter on them is a
 * string comparison with no timezone maths and no drift. Rows that carry a
 * real `createdAt` (clients, audit events) need an instant instead, so the
 * resolver hands back both — and the instants are the IST midnights either
 * side, not the server's. Mixing the two silently is how a client who signed
 * up at 11pm IST lands in yesterday.
 */

export const PRESETS = [
  { value: "today", label: "Today", days: 0 },
  { value: "week", label: "Last 7 days", days: 6 },
  { value: "month", label: "Last 30 days", days: 29 },
  { value: "year", label: "Last 12 months", days: 364 },
  { value: "all", label: "All time", days: null },
] as const;

export type Preset = (typeof PRESETS)[number]["value"];

export function isPreset(v: unknown): v is Preset {
  return typeof v === "string" && PRESETS.some((p) => p.value === v);
}

/** How far back the records could possibly go. Also the floor for "all time". */
const EPOCH = "2020-01-01";

export type Range = {
  /** The preset in use, or "custom" when the dates were typed. */
  preset: Preset | "custom";
  /** Inclusive, `YYYY-MM-DD` in clinic time. Null only for "all time". */
  from: string | null;
  /** Inclusive, `YYYY-MM-DD` in clinic time. Never in the future. */
  to: string;
  /** IST midnight at the start of `from`, for rows with a real timestamp. */
  fromAt: Date | null;
  /** IST midnight at the END of `to`, i.e. the first instant after it. */
  toAt: Date;
  /** The chip's wording: "Last 30 days", "1 Oct – 14 Oct 2026". */
  label: string;
  /** The same, safe to drop mid-sentence. A preset lowercases ("last 30
      days"); a date must not, because "1 oct" is not how a date is written. */
  inline: string;
  /** Whole days covered, for a grain that wants to fit itself to the range. */
  days: number;
};

const istMidnight = (date: string) => new Date(`${date}T00:00:00+05:30`);
const dayAfter = (date: string) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

const FMT = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const SHORT = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const asDate = (d: string) => new Date(`${d}T00:00:00Z`);

/** "1 – 14 Oct 2026", collapsing the parts the two ends share. */
function rangeLabel(from: string, to: string): string {
  if (from === to) return FMT.format(asDate(from));
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  return `${sameYear ? SHORT.format(asDate(from)) : FMT.format(asDate(from))} – ${FMT.format(asDate(to))}`;
}

/**
 * Resolve whatever is in the URL into a range.
 *
 * Everything is clamped rather than rejected: a filter is a view, and a view
 * that 500s or empties itself because somebody typed a date in 1823 is worse
 * than one that quietly shows what it can. A `from` after `to` is swapped,
 * because that is plainly what was meant.
 */
export function resolveRange(
  params: { period?: string; from?: string; to?: string },
  now: Date = new Date(),
  /**
   * Whether the range may reach past today.
   *
   * False for anything counting money, where a future date is always a typo —
   * nothing has been collected tomorrow. True for a calendar, where the whole
   * point is often next week: clamping a sessions filter to today would hide
   * every upcoming session and look like the list was broken.
   */
  opts: { allowFuture?: boolean } = {}
): Range {
  const today = todayIST(now);
  const valid = (d: string | undefined): d is string => !!d && DATE_RE.test(d) && !Number.isNaN(Date.parse(d));

  if (valid(params.from) || valid(params.to)) {
    /* A half-filled range is still a range: one end given means "from then
       until now" or "from the beginning until then", which is what somebody
       typing one date into one box is asking for. */
    let from = valid(params.from) ? params.from : EPOCH;
    let to = valid(params.to) ? params.to : today;
    if (from > to) [from, to] = [to, from];
    if (!opts.allowFuture && to > today) to = today;
    if (from < EPOCH) from = EPOCH;
    if (!opts.allowFuture && from > today) from = today;

    return {
      preset: "custom",
      from,
      to,
      fromAt: istMidnight(from),
      toAt: istMidnight(dayAfter(to)),
      label: rangeLabel(from, to),
      inline: rangeLabel(from, to),
      days: Math.round((asDate(to).getTime() - asDate(from).getTime()) / 86_400_000) + 1,
    };
  }

  const preset = isPreset(params.period) ? params.period : opts.allowFuture ? "all" : "month";
  const spec = PRESETS.find((p) => p.value === preset)!;
  const from = spec.days === null ? null : istDateOffset(-spec.days, now);

  return {
    preset,
    from,
    to: today,
    fromAt: from ? istMidnight(from) : null,
    toAt: istMidnight(dayAfter(today)),
    label: spec.label,
    inline: spec.label.toLowerCase(),
    days:
      spec.days === null
        ? Math.round((asDate(today).getTime() - asDate(EPOCH).getTime()) / 86_400_000) + 1
        : spec.days + 1,
  };
}

/** A Prisma `where` on a `YYYY-MM-DD` string column, or undefined for all time. */
export function dateWhere(range: Range) {
  return range.from ? { gte: range.from, lte: range.to } : undefined;
}

/** A Prisma `where` on a real timestamp column, or undefined for all time. */
export function instantWhere(range: Range) {
  return range.fromAt ? { gte: range.fromAt, lt: range.toAt } : undefined;
}

/** Carry the current range into a link that changes something else. */
export function rangeParams(range: Range): Record<string, string> {
  return range.preset === "custom"
    ? { from: range.from ?? EPOCH, to: range.to }
    : { period: range.preset };
}
