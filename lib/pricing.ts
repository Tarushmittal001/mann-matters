/**
 * Launch pricing.
 *
 * Every price shown with a line through it is the standard price this service
 * costs once the launch offer ends — a real price we will charge, not a
 * decoration. Invented "was" prices are a misleading advertisement under the
 * CCPA guidelines, and on a therapy site they cost more trust than they buy.
 *
 * So there are two things to keep honest here:
 *   1. the numbers below are what we charge from `LAUNCH_ENDS_ON` onwards;
 *   2. when that date passes, either move it (a real extension) or let the
 *      strike-through disappear on its own, which it does.
 */

/** Last day of the launch offer, in India. After this, only the standard price shows. */
export const LAUNCH_ENDS_ON = "2026-12-31";

/** What a service costs once the launch offer ends, by slug. */
export const STANDARD_SERVICE_PRICE: Record<string, number> = {
  "psychiatry-medication": 2499,
  "individual-therapy": 1499,
  "daily-life-stress": 1199,
  "student-support": 899,
  "career-counselling": 1399,
  "love-life-counselling": 1499,
  "couples-counseling": 2299,
  "family-therapy": 2699,
  "lgbtqia-affirmative": 1499,
  "group-sessions": 599,
};

/** What a therapist's session costs once the launch offer ends, by expert id. */
export const STANDARD_EXPERT_PRICE: Record<string, number> = {
  "ananya-iyer": 1799,
  "kabir-shah": 2299,
  "meera-krishnan": 1349,
  "arjun-mehta": 1499,
  "sana-qureshi": 1949,
  "rohan-nair": 1299,
};

/** Is the launch offer still running? Compared in IST, where our day ends. */
export function launchOfferActive(now: Date = new Date()): boolean {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
  return today <= LAUNCH_ENDS_ON;
}

/** "31 Dec 2026" — short, because it sits in one line of small print. */
export function launchEndsLabel(): string {
  const [y, m, d] = LAUNCH_ENDS_ON.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(Date.UTC(y, m - 1, d))
  );
}

/**
 * The standard price to strike through, or null when there is nothing honest to
 * show (offer over, no standard price set, or it isn't actually higher).
 */
export function standardPrice(
  kind: "service" | "expert",
  key: string,
  current: number | null | undefined,
  now?: Date
): number | null {
  if (!current || !launchOfferActive(now)) return null;
  const table = kind === "service" ? STANDARD_SERVICE_PRICE : STANDARD_EXPERT_PRICE;
  const standard = table[key];
  return standard && standard > current ? standard : null;
}

/** 999 against 1499 → 33. Rounded down, so the claim is never overstated. */
export function savingPercent(standard: number, current: number): number {
  return Math.floor(((standard - current) / standard) * 100);
}
