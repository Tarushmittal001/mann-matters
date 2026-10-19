import { prisma } from "@/lib/db";
import { listExperts } from "@/lib/experts-store";
import { priceForExpertService, servicesForExpert } from "@/lib/services";
import { concernMap, specialisesIn } from "@/lib/matching";
import type { Expert } from "@/lib/experts";
import { canPrescribe, professionLabel } from "@/lib/professions";

/**
 * Everything the public directory needs about one practitioner.
 *
 * Assembled here rather than in the page, because three of these facts are
 * easy to get subtly wrong and all three matter to somebody choosing who to
 * trust with their mental health.
 *
 * ── 1. WHO IS A DOCTOR ──────────────────────────────────────────────────────
 * Of eleven practitioners, exactly one holds a medical degree. "Dr. Kabir
 * Shah" and "Dr. Priyanka Sethi" are doctors by doctorate — a PhD — which is
 * an academic title, not a medical one. In India a psychologist or counsellor
 * cannot prescribe; a psychiatrist is a registered medical
 * practitioner and can. Somebody looking for medication needs to be able to
 * tell them apart at a glance, and somebody who is not looking for medication
 * should not be steered to a psychiatrist by a title.
 *
 * So an admin declares the profession on the listing (lib/professions.ts) and
 * the badge is read from that, never from the name or the credential line.
 *
 * ── 2. WHETHER THEY CAN ACTUALLY BE BOOKED ──────────────────────────────────
 * A listing with no weekly hours cannot take a booking, however complete the
 * rest of its profile looks. Showing such a card with a "Book" button is a
 * dead end discovered only after someone has chosen. The card says so instead.
 *
 * ── 3. WHAT THEY COST ───────────────────────────────────────────────────────
 * The service sets the price and a practitioner may set their own for it, so
 * the only honest summary is the range across what they are cleared to deliver.
 */

export type PractitionerCard = {
  slug: string;
  name: string;
  credentials: string;
  bio: string;
  years: number;
  rating: number;
  photo: string;
  languages: string[];
  specialties: string[];
  /** Services they are cleared for, with this practitioner's own price. */
  offers: { slug: string; title: string; duration: string; price: number | null }[];
  /** Lowest and highest of those prices; null when none of them is priced. */
  priceRange: { min: number; max: number } | null;
  /** A psychiatrist, so able to prescribe. Read from the declared profession. */
  prescribes: boolean;
  /** Medical council number, or a registration or membership number if they hold one. */
  registrationNo: string;
  /** "RCI" | "NMC" | "STATE" | "" — shown on this profile only, never as a
   *  claim about the practitioners as a group. */
  registrationBody: string;
  /** What to call the role, in a word a reader already understands. */
  discipline: string;
  /** Canonical concern ids this person works on — what the filters use. */
  concerns: string[];
  accentH: number;
  /** Has weekly hours set, so a booking can actually land. */
  bookable: boolean;
};

/**
 * One hue per practitioner — all distinct, and shuffled so neighbours differ.
 *
 * Handing out the evenly spaced hues in order gave every card its own colour
 * and still looked wrong: with eleven people the steps are 28° apart, and 28°
 * at this muted saturation is not a difference the eye reads. Cards sitting
 * side by side looked like a matching pair.
 *
 * So the set stays evenly spaced — that is what guarantees no two are alike —
 * and the ORDER is permuted by a stride. Stepping through the wheel `k` slots
 * at a time, with `k` coprime to the count, visits every hue exactly once (it
 * is a cyclic group) while putting roughly half the wheel between one card and
 * the next. Starting at half the count and walking down to the first coprime
 * value lands on the largest stride available, which is the widest separation
 * possible for that many people.
 *
 * 18° is where red begins and 350° is where it ends, so the sweep starts past
 * it and stops short of it: nothing here wears the colour this site reserves
 * for a crisis button.
 */
function strideFor(total: number): number {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  /* How far apart two cards `step` positions apart end up on the wheel, as a
     fraction of the whole. The grid is one, two or three columns depending on
     the viewport, so the card "next to" another is 1, 2 or 3 away and all
     three have to be judged — a stride that separates a row beautifully can
     still stack near-identical hues in a column. */
  const apart = (k: number, step: number) => {
    const slots = (k * step) % total;
    return Math.min(slots, total - slots);
  };

  let best = 1;
  let bestScore = -1;
  for (let k = 2; k < total; k++) {
    if (gcd(k, total) !== 1) continue; // must visit every hue exactly once
    const score = Math.min(apart(k, 1), apart(k, 2), apart(k, 3));
    if (score > bestScore) {
      bestScore = score;
      best = k;
    }
  }
  return best;
}

function hueFor(index: number, total: number): number {
  const START = 24;
  const SWEEP = 312;
  const n = Math.max(total, 1);
  // which evenly spaced slot this card takes, once the order is shuffled
  const slot = (index * strideFor(n)) % n;
  return Math.round(START + (SWEEP * slot) / n) % 360;
}

function toCard(
  e: Expert,
  withHours: Set<string>,
  rarity: Map<string, number>,
  index: number,
  total: number
): PractitionerCard {
  const offers = servicesForExpert(e).map((s) => ({
    slug: s.slug,
    title: s.title,
    duration: s.duration,
    price: priceForExpertService(e, s.slug),
  }));
  const prices = offers.map((o) => o.price).filter((p): p is number => typeof p === "number");

  return {
    slug: e.id,
    name: e.name,
    credentials: e.credentials,
    bio: e.bio ?? "",
    years: Number(String(e.experience).replace(/\D/g, "")) || 0,
    rating: e.rating,
    photo: e.photo,
    languages: e.languages,
    specialties: e.specialties,
    offers,
    priceRange: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
    prescribes: canPrescribe(e.profession),
    registrationNo: e.registrationNo,
    registrationBody: e.registrationBody,
    discipline: professionLabel(e.profession),
    concerns: concernMap.filter((c) => specialisesIn(e, c.keys)).map((c) => c.id),
    accentH: hueFor(index, total),
    bookable: offers.length > 0 && withHours.has(e.id),
  };
}

/** Everyone the public should see, in the order an admin chose. */
export async function listPractitioners(): Promise<PractitionerCard[]> {
  const experts = await listExperts(); // ACTIVE only — hiding a listing hides it here too
  const hours = await prisma.availabilityRule.findMany({
    select: { expertId: true },
    distinct: ["expertId"],
  });
  const withHours = new Set(hours.map((h) => h.expertId));

  // how many of the team offer each service, so each person can be coloured by
  // the one that is most distinctly theirs
  const rarity = new Map<string, number>();
  for (const e of experts) {
    for (const slug of e.services) rarity.set(slug, (rarity.get(slug) ?? 0) + 1);
  }

  return experts.map((e, i) => toCard(e, withHours, rarity, i, experts.length));
}

/** One practitioner by their public id, or null. */
export async function getPractitioner(slug: string): Promise<PractitionerCard | null> {
  return (await listPractitioners()).find((p) => p.slug === slug) ?? null;
}

/**
 * The filter options the directory offers.
 *
 * Concerns come from the shared matching vocabulary — six named things —
 * rather than from the free-text specialities on the listings. Built from the
 * raw tags it produced thirty-one pills including "Anxiety" next to "Anxiety
 * disorders" and "LGBTQIA+ affirmative" next to "LGBTQIA+ affirmative care":
 * a wall to read, and near-duplicates that look careless on the one page whose
 * job is to earn trust. The specialities still show on each card, where the
 * detail is useful; they are just not what you filter by.
 *
 * Languages come from the listings, because that list is short, closed, and
 * already consistent.
 */
export function filtersFor(cards: PractitionerCard[]) {
  const languages = new Set<string>();
  for (const c of cards) c.languages.forEach((l) => languages.add(l));

  // only concerns somebody actually works on — a filter that can only ever
  // return nothing is worse than no filter
  const live = new Set(cards.flatMap((c) => c.concerns));

  return {
    languages: Array.from(languages).sort((a, b) => a.localeCompare(b)),
    concerns: concernMap
      .filter((c) => live.has(c.id))
      .map((c) => ({ id: c.id, label: c.short })),
  };
}
