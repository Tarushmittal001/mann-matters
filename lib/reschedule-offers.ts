import { isKnownSlot, todayIST } from "@/lib/features/booking/policy";

/**
 * A practitioner's offer of other times, and the rules it has to satisfy.
 *
 * Three dates, two times on each — six options. The shape is deliberate: one
 * alternative is not a choice, and a whole calendar is a chore. Six is enough
 * that most people find something and few enough to read in one go.
 */

export const MAX_DATES = 3;
export const TIMES_PER_DATE = 2;

/** How long the client has before the offer lapses and the original stands. */
export const OFFER_HOURS = 48;

export type OfferDate = { date: string; times: string[] };

export type OfferCheck =
  | { ok: true; options: OfferDate[] }
  | { ok: false; error: string };

/**
 * Validate what the practitioner proposed.
 *
 * Every rule here is also a rule the client's pick is checked against later,
 * because an offer is only a suggestion — what actually moves the booking is
 * the pick, and that is where the slot has to still be real and still be free.
 */
export function checkOffer(raw: unknown, currentDate: string, currentTime: string): OfferCheck {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: "Offer at least one date." };
  }
  if (raw.length > MAX_DATES) {
    return { ok: false, error: `You can offer up to ${MAX_DATES} dates.` };
  }

  const today = todayIST();
  const seenDates = new Set<string>();
  const options: OfferDate[] = [];

  for (const entry of raw) {
    const date = typeof entry?.date === "string" ? entry.date.trim() : "";
    const times = Array.isArray(entry?.times)
      ? entry.times.filter((t: unknown): t is string => typeof t === "string" && t.trim() !== "")
      : [];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "Each option needs a date." };
    if (date <= today) {
      return { ok: false, error: "Offer dates in the future — today is already in progress." };
    }
    if (seenDates.has(date)) {
      return { ok: false, error: "Offer each date once, with its two times." };
    }
    seenDates.add(date);

    if (times.length === 0) return { ok: false, error: "Give at least one time for each date." };
    if (times.length > TIMES_PER_DATE) {
      return { ok: false, error: `Up to ${TIMES_PER_DATE} times per date.` };
    }
    if (new Set(times).size !== times.length) {
      return { ok: false, error: "The two times on a date must be different." };
    }
    for (const t of times) {
      // the same grid the booking form offers, so an offer cannot propose a
      // time the client would then be unable to pick
      if (!isKnownSlot(t)) return { ok: false, error: `${t} is not one of the bookable times.` };
    }
    if (times.some((t: string) => date === currentDate && t === currentTime)) {
      return { ok: false, error: "One of those is the time it is already at." };
    }

    options.push({ date, times: times.sort() });
  }

  return { ok: true, options: options.sort((a, b) => a.date.localeCompare(b.date)) };
}

/** Read the stored JSON back, defensively — a bad row must not break a page. */
export function parseOptions(json: string): OfferDate[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((o) => o && typeof o.date === "string" && Array.isArray(o.times))
      .map((o) => ({ date: o.date as string, times: (o.times as string[]).filter(Boolean) }));
  } catch {
    return [];
  }
}

/** Whether a pick is one of the times actually offered. */
export function wasOffered(options: OfferDate[], date: string, time: string): boolean {
  return options.some((o) => o.date === date && o.times.includes(time));
}

export function offerExpiry(options: OfferDate[], now: Date = new Date()): Date {
  const window = new Date(now.getTime() + OFFER_HOURS * 3_600_000);
  /* Never past the earliest slot on offer: an offer still "live" after the
     first of its own options has been and gone is just confusing. */
  const earliest = options.map((o) => o.date).sort()[0];
  const firstSlot = earliest ? new Date(`${earliest}T00:00:00+05:30`) : null;
  return firstSlot && firstSlot < window ? firstSlot : window;
}
