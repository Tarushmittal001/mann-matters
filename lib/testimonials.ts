/**
 * A client story as the homepage carousel shows it. Stories come only from
 * feedback a client actually submitted and an admin approved (`lib/feedback.ts`)
 * — there are deliberately no hand-written sample stories here.
 */
export type Testimonial = {
  quote: string;
  name: string;
  detail: string;
  /** Watercolor portrait in /public/reviews. Falls back to a monogram if missing. */
  image?: string;
};
