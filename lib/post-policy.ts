import { categories, type PostBlock } from "@/lib/posts";
import type { PostStatus } from "@/lib/blog";

/**
 * Who may do what to a post, and what a post must contain to go out.
 *
 * One module, imported by every route and both portals, for the same reason
 * booking policy lives in one file: two copies of a rule are two rules, and
 * the second one is wrong within a month.
 *
 * ── THE SHAPE OF IT ────────────────────────────────────────────────────────
 *   an EXPERT  writes their own, submits it, and may edit it again only
 *              while it is a draft or has been sent back
 *   an ADMIN   edits anything, publishes, sends back, and unpublishes
 *
 * An expert cannot publish, including their own work. These go out under a
 * named clinician on a mental-health service, where a sourceless statistic or
 * advice that is wrong for somebody in crisis is a real harm, so a second
 * person reads it first. Admins publish their own directly: they are the
 * reviewers, and a reviewer approving themselves is a formality, not a check.
 */

export type Role = "USER" | "EXPERT" | "ADMIN";

/** The statuses an author may still edit in. PUBLISHED is admin-only. */
const AUTHOR_EDITABLE: PostStatus[] = ["DRAFT", "IN_REVIEW"];

export function canEdit(role: Role, status: PostStatus, isAuthor: boolean): boolean {
  if (role === "ADMIN") return true;
  if (role !== "EXPERT" || !isAuthor) return false;
  return AUTHOR_EDITABLE.includes(status);
}

export function canDelete(role: Role, status: PostStatus, isAuthor: boolean): boolean {
  if (role === "ADMIN") return true;
  // an author may bin their own work, but not something already public
  return role === "EXPERT" && isAuthor && status === "DRAFT";
}

/** Every move anyone can make, and who can make it. */
export const TRANSITIONS: Record<
  PostStatus,
  { to: PostStatus; roles: Role[]; authorOnly?: boolean; label: string }[]
> = {
  DRAFT: [
    { to: "IN_REVIEW", roles: ["EXPERT"], authorOnly: true, label: "Submit for review" },
    { to: "PUBLISHED", roles: ["ADMIN"], label: "Publish" },
  ],
  IN_REVIEW: [
    { to: "PUBLISHED", roles: ["ADMIN"], label: "Approve and publish" },
    { to: "DRAFT", roles: ["ADMIN"], label: "Send back to the author" },
    // an author can pull a submission back while nobody has acted on it
    { to: "DRAFT", roles: ["EXPERT"], authorOnly: true, label: "Withdraw" },
  ],
  PUBLISHED: [{ to: "ARCHIVED", roles: ["ADMIN"], label: "Unpublish" }],
  ARCHIVED: [{ to: "PUBLISHED", roles: ["ADMIN"], label: "Publish again" }],
};

export function canMove(
  role: Role,
  from: PostStatus,
  to: PostStatus,
  isAuthor: boolean
): boolean {
  return (TRANSITIONS[from] ?? []).some(
    (t) => t.to === to && t.roles.includes(role) && (!t.authorOnly || isAuthor)
  );
}

/** The moves this person can make from here, for building the buttons. */
export function movesFor(role: Role, from: PostStatus, isAuthor: boolean) {
  return (TRANSITIONS[from] ?? []).filter(
    (t) => t.roles.includes(role) && (!t.authorOnly || isAuthor)
  );
}

/* ── what a post must contain ───────────────────────────────────────────── */

export const TITLE_MAX = 120;
export const EXCERPT_MAX = 300;
export const TAKEAWAY_MAX = 200;
export const BLOCK_MAX = 4000;

export const CATEGORIES = categories.filter((c) => c !== "All") as readonly string[];

export type PostDraft = {
  title: string;
  excerpt: string;
  category: string;
  body: PostBlock[];
  takeaways: string[];
};

/**
 * Validation, returning the first human-readable problem or null.
 *
 * `publishing` tightens it: a draft may be half-written and saved, but
 * anything going in front of a reader needs a body and a summary.
 */
export function validateDraft(d: PostDraft, publishing: boolean): string | null {
  const title = d.title.trim();
  if (!title) return "Give the post a title.";
  if (title.length > TITLE_MAX) return `Keep the title under ${TITLE_MAX} characters.`;

  if (!CATEGORIES.includes(d.category)) return "Choose a category.";

  if (d.excerpt.length > EXCERPT_MAX) return `Keep the summary under ${EXCERPT_MAX} characters.`;

  if (!Array.isArray(d.body)) return "The post body is missing.";
  for (const b of d.body) {
    if (!b || typeof b.text !== "string") return "One of the blocks is empty.";
    if (!["p", "h2", "quote"].includes(b.type)) return "Unknown block type.";
    if (b.text.length > BLOCK_MAX) return "One of the blocks is too long.";
  }

  if (!Array.isArray(d.takeaways)) return "Takeaways must be a list.";
  if (d.takeaways.some((t) => typeof t !== "string" || t.length > TAKEAWAY_MAX))
    return `Keep each takeaway under ${TAKEAWAY_MAX} characters.`;

  if (publishing) {
    if (!d.excerpt.trim()) return "Write a short summary before this goes out.";
    const words = d.body.reduce((n, b) => n + b.text.trim().split(/\s+/).length, 0);
    if (words < 120) return "The post is too short to publish — write at least 120 words.";
  }
  return null;
}

/* ── cover art, chosen for them ─────────────────────────────────────────── */

/**
 * A cover per category, reusing the art the original essays already ship with,
 * plus the Devanagari word set across it.
 *
 * Authors do not supply a photograph. Asking a practitioner to source and
 * licence an image before they can publish is how a blog ends up with no
 * second post. Admins can still override both fields.
 */
export const COVER_BY_CATEGORY: Record<string, { cover: string; deva: string; alt: string }> = {
  Anxiety: {
    cover:
      "https://images.unsplash.com/photo-1494548162494-384bba4ab999?auto=format&fit=crop&w=1600&q=80",
    deva: "नींद",
    alt: "A dark blue sky at dawn over a quiet horizon",
  },
  Relationships: {
    cover:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1600&q=80",
    deva: "परिवार",
    alt: "A family having tea together at a kitchen table",
  },
  "Student Life": {
    cover:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1600&q=80",
    deva: "परीक्षा",
    alt: "An open textbook with handwritten notes and a pen",
  },
  Workplace: {
    cover:
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1600&q=80",
    deva: "थकान",
    alt: "An empty desk with a laptop in a dim office after hours",
  },
  "Self-care": {
    cover:
      "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1600&q=80",
    deva: "शुरुआत",
    alt: "A warm cup of coffee beside a notebook near a bright window",
  },
};

export function artFor(category: string) {
  return COVER_BY_CATEGORY[category] ?? COVER_BY_CATEGORY["Self-care"];
}
