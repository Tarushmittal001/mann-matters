/**
 * What a practitioner is, as an admin declares it.
 *
 * This used to be guessed from the free-text credential line on every read —
 * "MBBS" or "MD" somewhere in it meant psychiatrist. A guess is the wrong tool
 * for the one fact that decides who may prescribe: "M.D. (Psychiatry)", the
 * way most Indian psychiatrists write it, did not match, and nothing stopped a
 * psychologist being ticked for the medication service. So it is a field now,
 * chosen from this list, and the guess survives only to pre-fill old listings.
 *
 * Imported by the admin form and the API alike, so the browser and the server
 * agree on the choices and on the rules.
 */

export type Profession =
  | "PSYCHIATRIST"
  | "CLINICAL_PSYCHOLOGIST"
  | "COUNSELLING_PSYCHOLOGIST"
  | "PSYCHOLOGIST";

export const PROFESSIONS: {
  value: Profession;
  /** What the public sees on the card, in a word a reader already understands. */
  label: string;
  /** The line under the dropdown in admin. */
  note: string;
  /** Which register the number on the listing comes from. */
  register: string;
}[] = [
  {
    value: "PSYCHIATRIST",
    label: "Psychiatrist",
    note: "A medical doctor (MBBS + MD/DNB/DPM in psychiatry). Can prescribe and review medication.",
    register: "Medical council registration (NMC or state)",
  },
  {
    value: "CLINICAL_PSYCHOLOGIST",
    label: "Clinical psychologist",
    note: "Postgraduate in clinical psychology (M.A./M.Sc., M.Phil., Psy.D. or Ph.D.). Cannot prescribe.",
    register: "Registration or membership number, if they hold one",
  },
  {
    value: "COUNSELLING_PSYCHOLOGIST",
    label: "Counselling psychologist",
    note: "Postgraduate or Ph.D. in counselling psychology. Cannot prescribe.",
    register: "Registration or membership number, if they hold one",
  },
  {
    value: "PSYCHOLOGIST",
    label: "Psychologist",
    note: "Postgraduate in psychology, working through talking. Cannot prescribe.",
    register: "Registration or membership number, if they hold one",
  },
];

/**
 * Only a prescriber must carry a number before going live: a prescription
 * without a medical-council registration is not one a pharmacy can act on.
 * Psychologists and counsellors are listed on verified qualifications; many
 * hold no registration, so for them the number is optional.
 */
export function registrationRequired(value: string): boolean {
  return canPrescribe(value);
}

export function isProfession(value: unknown): value is Profession {
  return PROFESSIONS.some((p) => p.value === value);
}

export function professionLabel(value: string): string {
  return PROFESSIONS.find((p) => p.value === value)?.label ?? "Psychologist";
}

/** Only a medical doctor can prescribe. */
export function canPrescribe(value: string): boolean {
  return value === "PSYCHIATRIST";
}

/**
 * Services only a prescriber may be cleared for. The admin form disables these
 * for anyone else, the API refuses them, and the store drops them on read, so
 * an older listing saved before this rule cannot be booked for one either.
 */
export const PRESCRIBER_ONLY_SERVICES = ["psychiatry-medication"] as const;

export function requiresPrescriber(serviceSlug: string): boolean {
  return (PRESCRIBER_ONLY_SERVICES as readonly string[]).includes(serviceSlug);
}

/**
 * A best guess from the credential line — only ever used to pre-fill a listing
 * that has no profession yet. Mirrors the backfill in the
 * `expert_profession` migration.
 *
 * A medical qualification on whole words: MBBS, MD or M.D., DNB, DPM,
 * MRCPsych — but not M.D.Sc or MDS, and never "Dr.", which a PhD also earns.
 */
export function guessProfession(credentials: string): Profession {
  if (/(^|[^a-z])(mbbs|m\.? ?d|dnb|dpm|mrcpsych)(?![.]?[a-z])/i.test(credentials)) return "PSYCHIATRIST";
  if (/clinical/i.test(credentials)) return "CLINICAL_PSYCHOLOGIST";
  if (/counsell?ing/i.test(credentials)) return "COUNSELLING_PSYCHOLOGIST";
  return "PSYCHOLOGIST";
}

/* ── council registers ──────────────────────────────────────────────────── */

/**
 * The registers a practitioner may be on, and how each is named in public.
 *
 * Emoraa does not require any of them. The site says its practitioners are
 * certified — a postgraduate qualification we have checked — and shows a
 * register only on the profile of the person who is actually on it. The
 * distinction matters: "our psychologists are RCI-registered" is a claim about
 * everyone and would be false, while "RCI registered" under one name is true.
 */
export const REGISTER_OPTIONS = [
  { value: "", label: "None" },
  { value: "RCI", label: "RCI registered" },
  { value: "NMC", label: "NMC registered" },
  { value: "STATE", label: "State medical council" },
] as const;

export function registerLabel(body: string): string {
  return REGISTER_OPTIONS.find((o) => o.value === body)?.label ?? "";
}

export function isRegisterBody(value: string): boolean {
  return REGISTER_OPTIONS.some((o) => o.value === value);
}
