/**
 * One set of field rules, imported by both the form and the route handler, so a
 * message a user sees while typing is the same message the server would give.
 * The client copy is a courtesy; the server copy is the one that decides.
 *
 * Pure and isomorphic — no node built-ins, no React, safe in Edge and browser.
 */

export type FieldErrors = Record<string, string>;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^\d{2}:\d{2}$/;
// an Indian mobile, once punctuation and any country code are stripped off
export const PHONE_LOCAL_RE = /^[6-9]\d{9}$/;

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 200;
export const OTP_LENGTH = 6;
export const NAME_MIN = 2;
export const NAME_MAX = 80;
export const NOTES_MAX = 500;

export function validateName(raw: string): string | null {
  const name = raw.trim();
  if (name.length < NAME_MIN) return "Please tell us your name.";
  if (name.length > NAME_MAX) return `Please keep this under ${NAME_MAX} characters.`;
  return null;
}

export function validateEmail(raw: string): string | null {
  const email = raw.trim();
  if (!email) return "We need an email to reach you.";
  if (email.length > 254 || !EMAIL_RE.test(email)) return "That email doesn't look right.";
  return null;
}

export function validatePassword(raw: string): string | null {
  if (raw.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (raw.length > PASSWORD_MAX) return "That password is too long.";
  // deliberately no composition rules — length is the honest signal
  return null;
}

/**
 * Optional field: empty is fine, malformed is not.
 *
 * People type "98765 43210", "+91-98765-43210", "091 98765 43210". None of
 * those is a mistake, so punctuation and the country code come off before the
 * number is judged — rejecting a correct number for its spacing is our bug,
 * not theirs.
 */
export function validatePhone(raw: string): string | null {
  const phone = raw.trim();
  if (!phone) return null;
  if (!PHONE_LOCAL_RE.test(localDigits(phone))) {
    return "Enter a 10-digit Indian mobile number.";
  }
  return null;
}

export function validateRequiredPhone(raw: string): string | null {
  return validatePhone(raw) ?? (raw.trim() ? null : "Enter your mobile number.");
}

export function validateOtp(raw: string): string | null {
  return new RegExp(`^\\d{${OTP_LENGTH}}$`).test(raw.trim())
    ? null
    : `Enter the ${OTP_LENGTH}-digit code.`;
}

/** Strip punctuation and any leading country code, leaving the 10-digit local part. */
function localDigits(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length > 10 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

/* ---------------------------------------------------------------- profile */

/** Under 13 can't consent to their own care; over 120 is a typo. */
export const AGE_MIN = 13;
export const AGE_MAX = 120;
/** Below this, Indian law needs a parent or guardian to agree to therapy. */
export const AGE_GUARDIAN_BELOW = 18;

export const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
] as const;

export const ORGANISATION_MAX = 80;

/**
 * The language a client would rather be in session in.
 *
 * Optional, and deliberately NOT limited to what the team currently covers.
 * The point of asking is to learn who to hire next, and a list that only
 * offers languages somebody already speaks can never surface that — it would
 * answer the question with its own assumptions. A client who wants Odia and
 * finds nobody is the single most useful row on the admin's language panel.
 *
 * The values are the display strings rather than codes, because they are
 * compared against the practitioner `languages` arrays, which are display
 * strings too. Keep the spelling identical to lib/expert-vocab.ts or the two
 * sides stop matching and the panel quietly shows demand with no supply.
 */
export const LANGUAGE_OPTIONS = [
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
  "Nepali",
  "Manipuri",
  "Indian Sign Language",
] as const;

/** Optional: blank is a real answer, anything off the list is not. */
export function validateLanguage(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  return (LANGUAGE_OPTIONS as readonly string[]).includes(value)
    ? null
    : "Please choose one of the languages listed.";
}

/**
 * Where a client is, in two parts.
 *
 * Asked so the practice can see which parts of India it actually reaches, and
 * decide where it is short of practitioners who speak the local language.
 *
 * ── WHY STATE IS A LIST AND CITY IS NOT ────────────────────────────────────
 * The state is picked from this fixed list because the whole value of the
 * answer is being able to group it. Free text produces "Delhi", "delhi", "New
 * Delhi" and "NCR" as four separate regions within a week, and no amount of
 * later cleaning puts them back together. The city is free text because no
 * list of Indian towns is complete enough to turn away somebody who lives in a
 * real one — a dropdown that cannot find your town reads as "we do not serve
 * people like you", which is not a thing a mental-health service should say at
 * the moment somebody is signing up.
 *
 * All 28 states and 8 union territories, alphabetically, with the UTs after
 * the states so a person scanning for their state is not reading past Delhi to
 * reach Goa.
 */
export const STATE_OPTIONS = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  // union territories
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export const CITY_MAX = 60;

/** Required, and must be one of the listed states or union territories. */
export function validateState(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Please choose your state.";
  return (STATE_OPTIONS as readonly string[]).includes(value)
    ? null
    : "Please choose one of the states listed.";
}

/**
 * Required, free text, and deliberately permissive. It rejects by exception
 * rather than by allow-list: anything that is not a digit or obvious markup
 * passes, so "Thiruvananthapuram", "St. Thomas Mount", "Kozhikode (Calicut)"
 * and a name typed in Devanagari all go through. An allow-list of letters
 * would have to name every script used in India, and the one it forgot would
 * be somebody's home.
 *
 * Digits are refused because they mean an address has been pasted into the
 * wrong box, and we have no reason to hold a client's street address.
 */
export function validateCity(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Please tell us which city or town you are in.";
  if (value.length < 2) return "Please enter the full name of your city or town.";
  if (value.length > CITY_MAX) return `Please keep this under ${CITY_MAX} characters.`;
  if (/\d/.test(value))
    return "Please enter just the city or town name, without a house or street number.";
  if (/[<>@#$%^&*_=+[\]{}\|\/~`"!?;:]/.test(value))
    return "Please enter just the city or town name.";
  return null;
}

/**
 * Signup consent to the Terms and Privacy Policy. Under the DPDP Act consent
 * must be a clear affirmative act, so this is an unticked box the person ticks,
 * checked again on the server — never assumed from pressing "Sign up".
 */
export function validateTermsConsent(agreed: unknown): string | null {
  return agreed === true ? null : "Please agree to the Terms of use and Privacy policy to continue.";
}

export function validateAge(raw: string): string | null {
  const age = Number(raw.trim());
  if (!raw.trim()) return "Please tell us your age.";
  if (!Number.isInteger(age)) return "Enter your age in whole years.";
  if (age < AGE_MIN || age > AGE_MAX) return `Please enter an age between ${AGE_MIN} and ${AGE_MAX}.`;
  return null;
}

export function validateGender(raw: string): string | null {
  return GENDER_OPTIONS.some((g) => g.value === raw) ? null : "Please choose one of the options.";
}

export function validateOrganisation(raw: string): string | null {
  return raw.trim().length > ORGANISATION_MAX
    ? `Please keep this under ${ORGANISATION_MAX} characters.`
    : null;
}

/** One half of a name: shorter limits than the full name, and always required. */
export function validateNamePart(raw: string, what: "first" | "last"): string | null {
  const value = raw.trim();
  if (!value) return what === "first" ? "Please tell us your first name." : "Please tell us your last name.";
  if (value.length > 40) return "Please keep this under 40 characters.";
  return null;
}

export function validateNotes(raw: string): string | null {
  if (raw.length > NOTES_MAX) return `Please keep this under ${NOTES_MAX} characters.`;
  return null;
}

/** Strip formatting so the stored value is always +91XXXXXXXXXX or "". */
export function normalisePhone(raw: string): string {
  const local = localDigits(raw);
  return local ? `+91${local}` : "";
}


/** `priya@example.com` → `p•••a@example.com`. Used anywhere but the owner's own page. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "•••";
  if (local.length <= 2) return `${local[0] ?? "•"}•••@${domain}`;
  return `${local[0]}${"•".repeat(Math.min(local.length - 2, 5))}${local.at(-1)}@${domain}`;
}

export function collect(entries: Array<[string, string | null]>): FieldErrors {
  const out: FieldErrors = {};
  for (const [field, message] of entries) if (message) out[field] = message;
  return out;
}

export function hasErrors(fields: FieldErrors): boolean {
  return Object.keys(fields).length > 0;
}
