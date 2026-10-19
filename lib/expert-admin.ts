import { MAX_BIO } from "@/lib/expert-portal";
import { canPrescribe, isProfession, registrationRequired, requiresPrescriber } from "@/lib/professions";

/**
 * What an admin may set on a therapist listing, and what counts as valid.
 *
 * Shared by the form and the API so the browser and the server agree, and so
 * the server never trusts the browser's word for it.
 *
 * WHO WRITES WHAT. A listing is made in two steps. An admin creates it with
 * the facts Emoraa vouches for — name, profession, the qualification we
 * checked, any registration, the services they are cleared for and their
 * rates, a photo — and the login the practitioner will use. The practitioner
 * then completes what only they can describe — their introduction, languages,
 * focus areas and years of practice — from /expert/profile, which writes them
 * to this same row (EXPERT_OWNED). An admin can still edit those but does not
 * have to; a listing cannot go live until they exist, because matching and the
 * language filter read them.
 */

/** The listing fields a practitioner fills in for themselves from the portal. */
export const EXPERT_OWNED = ["bio", "languages", "specialties", "experienceYears"] as const;

export const EXPERT_LIMITS = {
  nameMax: 80,
  credentialsMax: 120,
  registrationMax: 40,
  // the portal's limit: the practitioner writes this field too
  bioMax: MAX_BIO,
  priceMin: 0,
  priceMax: 100000,
  yearsMax: 60,
  listMax: 8,
  itemMax: 40,
} as const;

export type ExpertDraft = {
  name: string;
  credentials: string;
  /** One of PROFESSIONS — required, and the only thing that decides who may prescribe. */
  profession: string;
  /** Medical council number, required for an ACTIVE psychiatrist; optional for everyone else. */
  registrationNo: string;
  /** "RCI" | "NMC" | "STATE" | "" — see REGISTER_OPTIONS. */
  registrationBody: string;
  experienceYears: string;
  languages: string[];
  specialties: string[];
  /** Service slugs this practitioner is cleared to deliver. Empty = bookable for nothing. */
  services: string[];
  /**
   * Their rate per service slug, as typed. A slug that is absent — or blank —
   * means the service's standard price, which is why this is sparse: leaving
   * the box empty is a real answer, not an unfinished one.
   */
  servicePrices: Record<string, string>;
  /**
   * Where to send their login invite, asked while the listing is being made.
   *
   * Only read when creating: an existing listing changes its login through
   * Manage, where removing and re-inviting is a deliberate two-step act rather
   * than a side effect of editing a credential line. Blank is allowed — a
   * listing can exist before the person has an address to use.
   */
  loginEmail: string;
  price: string;
  rating: string;
  photo: string;
  bio: string;
  status: string;
  sortOrder: string;
};

export const emptyExpertDraft: ExpertDraft = {
  name: "",
  credentials: "",
  profession: "",
  registrationNo: "",
  registrationBody: "",
  experienceYears: "",
  languages: [],
  specialties: [],
  services: [],
  servicePrices: {},
  loginEmail: "",
  price: "0",
  rating: "5",
  photo: "",
  bio: "",
  // hidden until the practitioner has completed their half of the profile
  status: "HIDDEN",
  sortOrder: "0",
};

/** "Dr. Ananya Iyer" → "dr-ananya-iyer": the id that appears in links and bookings. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export function validateExpert(
  draft: ExpertDraft,
  { creating = false }: { creating?: boolean } = {}
): Record<string, string> {
  const f: Record<string, string> = {};
  const name = draft.name.trim();
  if (!name) f.name = "A name is needed.";
  else if (name.length > EXPERT_LIMITS.nameMax) f.name = `Keep this under ${EXPERT_LIMITS.nameMax} characters.`;
  else if (!slugify(name)) f.name = "That name needs at least one letter or number.";

  // the qualification we checked: the "certified" claim on the site rests on it
  const credentials = draft.credentials.trim();
  if (!credentials) f.credentials = "Add the qualification you have checked — it is shown on their card.";
  else if (credentials.length > EXPERT_LIMITS.credentialsMax) {
    f.credentials = `Keep this under ${EXPERT_LIMITS.credentialsMax} characters.`;
  }

  if (!isProfession(draft.profession)) f.profession = "Choose what they are.";

  /*
   * A live psychiatrist can prescribe, so they need a medical-council number
   * a client and a pharmacy can check. Psychologists and counsellors are
   * listed on verified qualifications and may have no number to give. A
   * hidden listing can always be drafted without one.
   */
  const reg = (draft.registrationNo ?? "").trim();
  if (reg.length > EXPERT_LIMITS.registrationMax) {
    f.registrationNo = `Keep this under ${EXPERT_LIMITS.registrationMax} characters.`;
  } else if (reg && !/^[A-Za-z0-9][A-Za-z0-9 ./-]*$/.test(reg)) {
    f.registrationNo = "Letters, numbers, spaces, dots, slashes and dashes only.";
  } else if (!reg && draft.status === "ACTIVE" && registrationRequired(draft.profession)) {
    f.registrationNo = "Add their medical council number before listing them, or keep them hidden.";
  }

  /* Only a medical doctor can prescribe, so only a psychiatrist can be cleared for medication. */
  if (!canPrescribe(draft.profession) && (draft.services ?? []).some(requiresPrescriber)) {
    f.services = "Only a psychiatrist can be cleared for Psychiatry & medication.";
  }

  // the practitioner fills this in from their portal; blank here means "not yet"
  const years = Number(draft.experienceYears);
  if (draft.experienceYears.trim() && (!Number.isInteger(years) || years < 0 || years > EXPERT_LIMITS.yearsMax)) {
    f.experienceYears = `Years of experience: a whole number from 0 to ${EXPERT_LIMITS.yearsMax}.`;
  }

  /*
   * `draft.price` is the old flat per-therapist fee. It is no longer charged,
   * shown or editable, so it is not validated either — a listing must not be
   * rejected over a number nobody can see. The rates that matter are below.
   */
  for (const [slug, raw] of Object.entries(draft.servicePrices)) {
    if (!draft.services.includes(slug)) continue; // a rate for an unticked service is just stale
    if (raw.trim() === "") continue; // blank means the standard price
    const amount = Number(raw);
    if (!Number.isInteger(amount) || amount < EXPERT_LIMITS.priceMin || amount > EXPERT_LIMITS.priceMax) {
      f[`servicePrices.${slug}`] = `Up to ${EXPERT_LIMITS.priceMax.toLocaleString("en-IN")}`;
    }
  }

  const rating = Number(draft.rating);
  if (!draft.rating.trim() || Number.isNaN(rating) || rating < 0 || rating > 5) {
    f.rating = "A rating between 0 and 5.";
  }

  /* Completed by the practitioner, so optional while the listing is hidden.
     It cannot go live without them: matching and the language filter read
     these, and a card with neither tells a client nothing. */
  const incomplete =
    "Their profile is not complete — they add this from their portal. Keep the listing hidden until they do.";
  if (draft.status === "ACTIVE" && !draft.languages.length) f.languages = incomplete;
  if (draft.status === "ACTIVE" && !draft.specialties.length) f.specialties = incomplete;
  for (const [key, list] of [["languages", draft.languages], ["specialties", draft.specialties]] as const) {
    if (list.length > EXPERT_LIMITS.listMax) f[key] = `At most ${EXPERT_LIMITS.listMax}.`;
    else if (list.some((v) => v.trim().length === 0 || v.length > EXPERT_LIMITS.itemMax)) {
      f[key] = `Each one up to ${EXPERT_LIMITS.itemMax} characters.`;
    }
  }

  /* A new listing needs its login: the practitioner completes their own half
     of the profile, and nobody can do that without a way in. */
  const login = (draft.loginEmail ?? "").trim();
  if (creating && !login) {
    f.loginEmail = "Add the email they will sign in with — they complete their profile from there.";
  } else if (login &&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(login)) {
    f.loginEmail = "That doesn't look like an email address.";
  }

  const photo = draft.photo.trim();
  if (!photo) f.photo = "A photo is needed — the card looks broken without one.";
  else if (!/^https:\/\//.test(photo) && !photo.startsWith("/")) {
    f.photo = "Use an https:// address, or a path like /experts/name.jpg.";
  }

  if (draft.bio.trim().length > EXPERT_LIMITS.bioMax) f.bio = `Keep this under ${EXPERT_LIMITS.bioMax} characters.`;
  if (draft.status !== "ACTIVE" && draft.status !== "HIDDEN") f.status = "Choose listed or hidden.";

  const order = Number(draft.sortOrder);
  if (draft.sortOrder.trim() && (!Number.isInteger(order) || order < 0 || order > 999)) {
    f.sortOrder = "A whole number from 0 to 999.";
  }

  return f;
}
