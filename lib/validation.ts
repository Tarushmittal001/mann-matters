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

export function validateNotes(raw: string): string | null {
  if (raw.length > NOTES_MAX) return `Please keep this under ${NOTES_MAX} characters.`;
  return null;
}

/** Strip formatting so the stored value is always +91XXXXXXXXXX or "". */
export function normalisePhone(raw: string): string {
  const local = localDigits(raw);
  return local ? `+91${local}` : "";
}

/** Show a stored number back without exposing the whole thing in shared views. */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length < 4) return "••••";
  return `•••••• ${digits.slice(-4)}`;
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
