/**
 * What an admin may set on a therapist listing, and what counts as valid.
 *
 * Shared by the form and the API so the browser and the server agree, and so
 * the server never trusts the browser's word for it.
 */

export const EXPERT_LIMITS = {
  nameMax: 80,
  credentialsMax: 120,
  bioMax: 600,
  priceMin: 0,
  priceMax: 100000,
  yearsMax: 60,
  listMax: 8,
  itemMax: 40,
} as const;

export type ExpertDraft = {
  name: string;
  credentials: string;
  experienceYears: string;
  languages: string[];
  specialties: string[];
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
  experienceYears: "",
  languages: [],
  specialties: [],
  price: "",
  rating: "5",
  photo: "",
  bio: "",
  status: "ACTIVE",
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

export function validateExpert(draft: ExpertDraft): Record<string, string> {
  const f: Record<string, string> = {};
  const name = draft.name.trim();
  if (!name) f.name = "A name is needed.";
  else if (name.length > EXPERT_LIMITS.nameMax) f.name = `Keep this under ${EXPERT_LIMITS.nameMax} characters.`;
  else if (!slugify(name)) f.name = "That name needs at least one letter or number.";

  if (draft.credentials.trim().length > EXPERT_LIMITS.credentialsMax) {
    f.credentials = `Keep this under ${EXPERT_LIMITS.credentialsMax} characters.`;
  }

  const years = Number(draft.experienceYears);
  if (!draft.experienceYears.trim() || !Number.isInteger(years) || years < 0 || years > EXPERT_LIMITS.yearsMax) {
    f.experienceYears = `Years of experience: a whole number from 0 to ${EXPERT_LIMITS.yearsMax}.`;
  }

  const price = Number(draft.price);
  if (!draft.price.trim() || !Number.isInteger(price) || price < EXPERT_LIMITS.priceMin || price > EXPERT_LIMITS.priceMax) {
    f.price = `A whole rupee amount up to ${EXPERT_LIMITS.priceMax.toLocaleString("en-IN")}.`;
  }

  const rating = Number(draft.rating);
  if (!draft.rating.trim() || Number.isNaN(rating) || rating < 0 || rating > 5) {
    f.rating = "A rating between 0 and 5.";
  }

  if (!draft.languages.length) f.languages = "Add at least one language.";
  if (!draft.specialties.length) f.specialties = "Add at least one speciality.";
  for (const [key, list] of [["languages", draft.languages], ["specialties", draft.specialties]] as const) {
    if (list.length > EXPERT_LIMITS.listMax) f[key] = `At most ${EXPERT_LIMITS.listMax}.`;
    else if (list.some((v) => v.trim().length === 0 || v.length > EXPERT_LIMITS.itemMax)) {
      f[key] = `Each one up to ${EXPERT_LIMITS.itemMax} characters.`;
    }
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
