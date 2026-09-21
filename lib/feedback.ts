import type { Testimonial } from "@/lib/testimonials";

/**
 * Client feedback shown in "We heard you". Shared by the form, the API, the
 * admin review page and the home page, so the rules live in one place.
 */

export type FeedbackAvatar = { src: string; label: string };

/**
 * The couple portraits, which the picker lists after the single ones. Every
 * other numbered image in /public/reviews is a single portrait, so a new avatar
 * only needs dropping in as the next number (see lib/feedback-avatars.ts).
 */
export const COUPLE_AVATARS = new Set([19, 20, 21, 22, 23, 24]);

export const FEEDBACK_QUOTE_MIN = 20;
export const FEEDBACK_QUOTE_MAX = 400;
export const FEEDBACK_DETAIL_MAX = 60;

export const FEEDBACK_STATUS = {
  pending: "PENDING",
  approved: "APPROVED",
  hidden: "HIDDEN",
} as const;

export type NameStyle = "first" | "initial";

/** "Priya Sharma" → "Priya" or "P." — never the full name. */
export function publicName(fullName: string, style: NameStyle): string {
  const first = fullName.trim().split(/\s+/)[0] ?? "";
  if (!first) return "A client";
  return style === "initial" ? `${first[0].toUpperCase()}.` : first;
}

/** `avatars` is the allowed list; on the server it comes from the folder itself. */
export function validateFeedback(
  input: { quote: string; avatar: string; nameStyle: string; detail: string },
  avatars: FeedbackAvatar[]
) {
  const fields: Record<string, string> = {};
  const quote = input.quote.trim();
  if (quote.length < FEEDBACK_QUOTE_MIN) fields.quote = `Please write at least ${FEEDBACK_QUOTE_MIN} characters.`;
  else if (quote.length > FEEDBACK_QUOTE_MAX) fields.quote = `Please keep it under ${FEEDBACK_QUOTE_MAX} characters.`;
  if (!avatars.some((a) => a.src === input.avatar)) fields.avatar = "Please choose a portrait.";
  if (input.nameStyle !== "first" && input.nameStyle !== "initial") fields.nameStyle = "Please choose how your name appears.";
  if (input.detail.trim().length > FEEDBACK_DETAIL_MAX) fields.detail = `Please keep this under ${FEEDBACK_DETAIL_MAX} characters.`;
  return fields;
}

/** A stored, approved feedback row as the home page shows it. */
export function toTestimonial(row: {
  quote: string;
  avatar: string;
  nameStyle: string;
  detail: string | null;
  user: { name: string };
}): Testimonial {
  return {
    quote: row.quote,
    name: publicName(row.user.name, row.nameStyle === "initial" ? "initial" : "first"),
    detail: row.detail?.trim() || "Emoraa client",
    image: row.avatar,
  };
}
