export type PostBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string };

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: "Anxiety" | "Relationships" | "Student Life" | "Workplace" | "Self-care";
  readTime: string;
  date: string;
  displayDate: string;
  /** The photograph behind the cover, softened and washed. */
  cover: string;
  /** The Devanagari word set across it. */
  deva: string;
  coverAlt: string;
  author: { name: string; role: string };
  /** The short version, for readers who need it before they need the essay. */
  takeaways: string[];
  /** A free tool that puts the piece into practice. */
  tool: { href: string; label: string; note: string };
  featured?: boolean;
  content: PostBlock[];
};

/*
 * The posts themselves are NOT here any more.
 *
 * They are rows in the `Post` table, read through `lib/blog.ts`, so that a
 * practitioner can publish without a deploy. This file keeps only the things
 * the renderer needs and the database has no opinion about: the shared types,
 * the category list, and the heading helpers.
 *
 * The ten original essays were moved into the database by
 * `scripts/import-posts.mjs`, which reads `prisma/seed-posts.json`. That JSON
 * is seed data for a fresh environment and nothing else — it is deliberately
 * not importable as live content, because a second copy of a post that an
 * admin can edit is a copy that starts lying the moment they do.
 */

/** Stable anchor id for an h2, so the contents list and the prose agree. */
export function headingId(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function headingsOf(post: Post) {
  return post.content
    .filter((b): b is { type: "h2"; text: string } => b.type === "h2")
    .map((b) => ({ id: headingId(b.text), text: b.text }));
}

export const categories = [
  "All",
  "Anxiety",
  "Relationships",
  "Student Life",
  "Workplace",
  "Self-care",
] as const;
