import { prisma } from "@/lib/db";
import {
  categories,
  headingId,
  type Post,
  type PostBlock,
} from "@/lib/posts";

/**
 * Posts, read from the database.
 *
 * `lib/posts.ts` keeps the shared types, the category list and the heading
 * helpers — the things the renderer needs and the database has no opinion
 * about. The posts themselves live in the `Post` table, so a practitioner can
 * publish without a deploy. Everything that renders a post reads through here,
 * so there is one source of truth and one definition of "published".
 */

export type PostStatus = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";

export const STATUSES: PostStatus[] = ["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"];

export type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  body: unknown;
  takeaways: unknown;
  cover: string;
  coverAlt: string;
  deva: string;
  readMinutes: number;
  toolHref: string | null;
  toolLabel: string | null;
  toolNote: string | null;
  status: string;
  authorName: string;
  authorRole: string;
  publishedAt: Date | null;
  featured: boolean;
  createdAt: Date;
};

/** Minutes at 200 words a minute, the figure the original essays used. */
export function readMinutesOf(body: PostBlock[]): number {
  const words = body.reduce((n, b) => n + b.text.trim().split(/\s+/).length, 0);
  return Math.max(1, Math.round(words / 200));
}

/**
 * A URL-safe slug. Not reversible and not meant to be — two posts called the
 * same thing get a numeric suffix from `uniqueSlug` rather than colliding.
 */
export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) || "post"
  );
}

/** `slugify`, then the first free `-2`, `-3`… if that one is taken. */
export async function uniqueSlug(title: string, exceptId?: string): Promise<string> {
  const base = slugify(title);
  for (let n = 1; n < 200; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const clash = await prisma.post.findUnique({ where: { slug }, select: { id: true } });
    if (!clash || clash.id === exceptId) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/* ── shaping a row into what the renderer already understands ───────────── */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function displayDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Json columns come back as `unknown`; this is the only place that is cast. */
export function blocksOf(body: unknown): PostBlock[] {
  return Array.isArray(body) ? (body as PostBlock[]) : [];
}

export function takeawaysOf(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((t): t is string => typeof t === "string") : [];
}

/**
 * A row, as the existing `Post` shape. The blog pages were written against
 * that type and render dozens of fields from it; reshaping here means none of
 * them had to change when posts moved into the database.
 */
export function toPost(row: PostRow): Post {
  const when = row.publishedAt ?? row.createdAt;
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category as Post["category"],
    readTime: `${row.readMinutes} min read`,
    date: when.toISOString().slice(0, 10),
    displayDate: displayDate(when),
    cover: row.cover,
    deva: row.deva,
    coverAlt: row.coverAlt,
    author: { name: row.authorName, role: row.authorRole },
    takeaways: takeawaysOf(row.takeaways),
    tool: row.toolHref
      ? { href: row.toolHref, label: row.toolLabel ?? "", note: row.toolNote ?? "" }
      : { href: "", label: "", note: "" },
    featured: row.featured,
    content: blocksOf(row.body),
  };
}

const SELECT = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  body: true,
  takeaways: true,
  cover: true,
  coverAlt: true,
  deva: true,
  readMinutes: true,
  toolHref: true,
  toolLabel: true,
  toolNote: true,
  status: true,
  authorName: true,
  authorRole: true,
  publishedAt: true,
  featured: true,
  createdAt: true,
} as const;

/* ── what the public site reads ─────────────────────────────────────────── */

/** Every live post, newest first. The only query the public blog may use. */
export async function listPublished(): Promise<Post[]> {
  const rows = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    select: SELECT,
  });
  return rows.map(toPost);
}

/**
 * One live post. Drafts and posts in review are deliberately not reachable by
 * URL: an unpublished draft is somebody's unfinished thinking, and a guessable
 * slug should not expose it.
 */
export async function getPublished(slug: string): Promise<Post | null> {
  const row = await prisma.post.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: SELECT,
  });
  return row ? toPost(row) : null;
}

export { categories, headingId };
export type { Post, PostBlock };
