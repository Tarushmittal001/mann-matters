import { services } from "@/lib/services";
import { formatINR } from "@/lib/utils";

/**
 * The price figures that appear in marketing copy.
 *
 * "From ₹599" was typed into about ten places. It is the floor of the whole
 * catalogue, but ₹599 is the **student** rate — a general visitor booking
 * individual therapy pays ₹999. A reader who clicks through finds a different
 * number from the one that brought them, which is the kind of claim
 * `lib/pricing.ts` already warns about for struck-through prices.
 *
 * So the numbers are read from the catalogue here, and the copy names who
 * pays what. Change a price in `lib/services.ts` and every sentence follows.
 */

const STUDENT_SLUG = "student-support";
const GENERAL_SLUG = "individual-therapy";
const GROUP_SLUG = "group-sessions";

function priceOf(slug: string): number | null {
  const s = services.find((x) => x.slug === slug);
  return typeof s?.price === "number" ? s.price : null;
}

/** What individual therapy costs — the number most adults will actually pay. */
export const generalFrom: number | null = priceOf(GENERAL_SLUG);
/** The student rate. Lower, but not available to everyone. */
export const studentFrom: number | null = priceOf(STUDENT_SLUG);
/** Group sessions, the cheapest thing on the catalogue. */
export const groupFrom: number | null = priceOf(GROUP_SLUG);

/**
 * "Individual therapy from ₹999, student sessions from ₹599" — the honest
 * one-liner. Both numbers, so neither is a surprise later.
 */
export function priceLine(): string {
  const parts: string[] = [];
  if (generalFrom !== null) parts.push(`individual therapy from ${formatINR(generalFrom)}`);
  if (studentFrom !== null) parts.push(`student sessions from ${formatINR(studentFrom)}`);
  return parts.join(", ");
}

/**
 * "from ₹999" — for places with room for only one number.
 *
 * Deliberately the GENERAL price, not the catalogue floor. A single figure in
 * a headline should be the one most readers will be charged.
 */
export function headlinePrice(): string {
  return generalFrom !== null ? `from ${formatINR(generalFrom)}` : "";
}
