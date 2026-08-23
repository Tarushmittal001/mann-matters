import { experts, type Expert } from "@/lib/experts";

/**
 * The therapist-matching vocabulary, shared by the full matcher on /match and
 * the one-tap concern picker on the home page so both speak the same language.
 */

export type Concern = { id: string; label: string; short: string; keys: string[] };

export const concernMap: Concern[] = [
  { id: "anxiety", label: "Anxiety & overthinking", short: "Anxiety", keys: ["anxiety", "self-esteem", "mindfulness"] },
  { id: "stress", label: "Stress & burnout", short: "Burnout", keys: ["workplace stress", "burnout", "career", "transitions"] },
  { id: "relationships", label: "Relationships & family", short: "Relationships", keys: ["relationships", "couples", "grief", "family"] },
  { id: "career", label: "Studies & career", short: "Studies", keys: ["student", "exam", "career", "burnout"] },
  { id: "sleep", label: "Sleep", short: "Sleep", keys: ["sleep", "mindfulness"] },
  { id: "depression", label: "Low mood & depression", short: "Low mood", keys: ["depression", "women", "self-esteem"] },
];

export const languageOpts = ["Hindi", "English", "Tamil", "Malayalam", "Marathi", "Any language"];

export const budgetOpts: { label: string; test: (p: number) => boolean }[] = [
  { label: "Student-friendly · under ₹900", test: (p) => p < 900 },
  { label: "Standard · ₹900–1,200", test: (p) => p >= 900 && p <= 1200 },
  { label: "Senior · ₹1,200+", test: (p) => p > 1200 },
  { label: "Any budget", test: () => true },
];

export function findConcern(id?: string | null): Concern | null {
  return concernMap.find((c) => c.id === id) ?? null;
}

/** True when a therapist's specialties overlap a concern's keywords. */
export function specialisesIn(e: Expert, keys: string[]): boolean {
  const specs = e.specialties.join(" ").toLowerCase();
  return keys.some((k) => specs.includes(k));
}

/** Everyone who works on this concern, best-rated first. */
export function expertsFor(keys: string[]): Expert[] {
  return experts.filter((e) => specialisesIn(e, keys)).sort((a, b) => b.rating - a.rating);
}

export function rank(
  concernKeys: string[],
  language: string,
  budget: (p: number) => boolean
): Expert[] {
  return [...experts]
    .map((e) => {
      let score = 0;
      if (specialisesIn(e, concernKeys)) score += 4;
      if (language === "Any language" || e.languages.includes(language)) score += 2;
      if (budget(e.price)) score += 2;
      score += e.rating - 4.5; // gentle tiebreak toward higher-rated
      return { e, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((o) => o.e);
}
