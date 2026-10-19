import { seedExperts } from "@/lib/experts";

/**
 * What languages a session can actually be held in.
 *
 * Three places used to answer this and all three disagreed: the home page said
 * "8 Indian languages", /made-in-india said "Hindi and English today", and the
 * FAQ said "2+". They disagreed because each had the answer typed into it.
 * Everything reads from here now, so there is one answer.
 *
 * ── TWO THINGS THIS GETS RIGHT THAT THE OLD COPY DID NOT ───────────────────
 *  1. **English is not an Indian language.** The old count said "8 Indian
 *     languages" from a list that included it. `indianLanguages` excludes it,
 *     so the number is one a reader can check.
 *  2. **Nothing is promised that nobody speaks.** The old copy offered Telugu
 *     and Bengali "through 2026" while no practitioner spoke either. A
 *     language appears here only by being in somebody's profile.
 *
 * Derived from the practitioner roster, which is still the four placeholder
 * therapists — so these numbers move when real practitioners replace them.
 * That is the point: every surface moves with them, at once.
 */

/** Listed first wherever languages are named; the rest follow alphabetically. */
const LEAD = ["Hindi", "English"];

function roster(): string[] {
  // no Set spread: this file is compiled to a target that predates it
  const all: string[] = [];
  for (const e of seedExperts) {
    for (const l of e.languages) if (!all.includes(l)) all.push(l);
  }
  const rest = all.filter((l) => !LEAD.includes(l)).sort();
  return [...LEAD.filter((l) => all.includes(l)), ...rest];
}

/** Every language a session can be held in today, English included. */
export const allLanguages: string[] = roster();

/** The Indian ones. English is a language we work in, not an Indian language. */
export const indianLanguages: string[] = allLanguages.filter((l) => l !== "English");

/** "7" — the figure to put in front of the words "Indian languages". */
export const indianLanguageCount: number = indianLanguages.length;

/**
 * "Hindi, English, and six more Indian languages" — the long form, for prose.
 * Falls back gracefully when the roster is small, so it never reads
 * "and 0 more".
 */
export function languageSentence(): string {
  const extra = allLanguages.filter((l) => !LEAD.includes(l)).length;
  const lead = LEAD.filter((l) => allLanguages.includes(l)).join(" and ");
  if (!extra) return lead;
  return `${lead}, and ${extra} more Indian ${extra === 1 ? "language" : "languages"}`;
}

/** "Hindi, English, Gujarati, Kannada…" — the plain list. */
export function languageList(): string {
  return allLanguages.join(", ");
}
