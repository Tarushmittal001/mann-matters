/**
 * The words the therapist form offers as suggestions.
 *
 * Matching reads languages and specialities as plain strings, so "Anxiety" and
 * "anxiety disorders" are two different things to it and a client gets matched
 * to neither reliably. A free-text box makes that drift inevitable — ten
 * listings added over a year will spell the same speciality six ways.
 *
 * So the form suggests from this list first, and what is already in use on the
 * catalogue second. It does not *restrict* to it: a therapist who speaks
 * Konkani must be listable on the day they join, not after a code change.
 */

/** Offered in roughly the order an Indian practice would need them. */
export const LANGUAGE_SUGGESTIONS = [
  "English",
  "Hindi",
  "Hinglish",
  "Marathi",
  "Bengali",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Gujarati",
  "Punjabi",
  "Urdu",
  "Odia",
  "Assamese",
  "Konkani",
  "Kashmiri",
  "Maithili",
  "Bhojpuri",
  "Rajasthani",
  "Haryanvi",
  "Tulu",
  "Sindhi",
  "Nepali",
  "Manipuri",
  "Indian Sign Language",
];

/**
 * Specialities, grouped only for readability here — the form sees one flat
 * list. These are the words the matcher already looks for, so adding one here
 * without teaching the matcher about it is harmless, but renaming one is not.
 */
export const SPECIALITY_SUGGESTIONS = [
  // mood & anxiety
  "Anxiety",
  "Panic attacks",
  "Depression",
  "Low mood",
  "Stress",
  "Burnout",
  "Anger",
  "OCD",
  "Trauma & PTSD",
  "Phobias",
  "Bipolar disorder",
  "ADHD",
  "Self-esteem",
  "Loneliness",
  // life stage & circumstance
  "Student & exam stress",
  "Career confusion",
  "Workplace stress",
  "Relationship issues",
  "Break-ups",
  "Marriage & couples",
  "Family conflict",
  "Parenting",
  "Teen mental health",
  "Child behaviour",
  "Grief & loss",
  "Sleep problems",
  "Body image",
  "Eating concerns",
  "Chronic illness",
  "Postpartum",
  "Menopause",
  // identity & context
  "LGBTQIA+ affirmative",
  "Gender identity",
  "Queer relationships",
  "Cultural identity",
  "Caste & discrimination",
  "Migration & relocation",
  // clinical practice
  "Psychiatric medication",
  "CBT",
  "DBT",
  "ACT",
  "Mindfulness",
  "EMDR",
  "Couples therapy",
  "Family therapy",
  "Addiction & substance use",
  "Suicidal thoughts",
  "Self-harm",
];

/**
 * The suggestion list for a field: the curated words first, then anything the
 * catalogue already uses that isn't in it, so a word somebody typed once
 * becomes the obvious choice the next time rather than being retyped slightly
 * differently.
 */
export function mergeSuggestions(curated: string[], inUse: string[]): string[] {
  const seen = new Set(curated.map((v) => v.toLowerCase()));
  const extra: string[] = [];
  for (const value of inUse) {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    extra.push(value.trim());
  }
  return [...curated, ...extra.sort((a, b) => a.localeCompare(b))];
}
