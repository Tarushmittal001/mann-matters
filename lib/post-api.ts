import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readMinutesOf, uniqueSlug, type PostStatus } from "@/lib/blog";
import {
  artFor,
  canDelete,
  canEdit,
  canMove,
  validateDraft,
  type PostDraft,
  type Role,
} from "@/lib/post-policy";
import type { PostBlock } from "@/lib/posts";

/**
 * The handlers behind both /api/expert/posts and /api/admin/posts.
 *
 * One implementation, two mount points. The difference between a practitioner
 * and an admin is entirely in `lib/post-policy.ts`, so the routes cannot drift
 * apart: an expert hitting the admin URL is refused by the same function that
 * refuses them in their own portal.
 */

type Actor = { id: string; role: Role; name: string };

async function actor(): Promise<Actor | null> {
  const session = await getSession();
  if (!session) return null;
  if (session.role !== "EXPERT" && session.role !== "ADMIN") return null;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, role: true },
  });
  if (!user) return null;
  return { id: user.id, role: user.role as Role, name: user.name };
}

const DENY = NextResponse.json({ error: "Not found." }, { status: 404 });
const NO_AUTH = NextResponse.json(
  { error: "You need to be signed in to do that." },
  { status: 401 }
);

/** The byline for a practitioner: their profile headline, else a plain title. */
async function bylineRole(userId: string, role: Role): Promise<string> {
  if (role === "ADMIN") return "Emoraa";
  const profile = await prisma.expertProfile.findUnique({
    where: { userId },
    select: { headline: true },
  });
  return profile?.headline?.trim() || "Psychologist";
}

function cleanBody(value: unknown): PostBlock[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (b): b is PostBlock =>
        !!b &&
        typeof b === "object" &&
        typeof (b as PostBlock).text === "string" &&
        ["p", "h2", "quote"].includes((b as PostBlock).type)
    )
    .map((b) => ({ type: b.type, text: b.text.trim() }))
    .filter((b) => b.text.length > 0);
}

function cleanDraft(payload: Record<string, unknown>): PostDraft {
  return {
    title: typeof payload.title === "string" ? payload.title.trim() : "",
    excerpt: typeof payload.excerpt === "string" ? payload.excerpt.trim() : "",
    category: typeof payload.category === "string" ? payload.category : "",
    body: cleanBody(payload.body),
    takeaways: Array.isArray(payload.takeaways)
      ? payload.takeaways
          .filter((t): t is string => typeof t === "string")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 6)
      : [],
  };
}

/* ── list ───────────────────────────────────────────────────────────────── */

/**
 * An expert sees only their own posts. An admin sees everything.
 *
 * This is the whole access rule for the list, and it is a `where` clause
 * rather than a filter after the fact — a post an expert may not see is never
 * read out of the database in the first place.
 */
export async function listPosts() {
  const me = await actor();
  if (!me) return NO_AUTH;

  const rows = await prisma.post.findMany({
    where: me.role === "ADMIN" ? {} : { authorId: me.id },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      status: true,
      authorId: true,
      authorName: true,
      reviewNote: true,
      publishedAt: true,
      updatedAt: true,
      readMinutes: true,
    },
  });
  return NextResponse.json({ posts: rows, me: { id: me.id, role: me.role } });
}

/* ── create ─────────────────────────────────────────────────────────────── */

export async function createPost(req: Request) {
  const me = await actor();
  if (!me) return NO_AUTH;

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const draft = cleanDraft(payload);
  const problem = validateDraft(draft, false);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const art = artFor(draft.category);
  const post = await prisma.post.create({
    data: {
      slug: await uniqueSlug(draft.title),
      title: draft.title,
      excerpt: draft.excerpt,
      category: draft.category,
      body: draft.body,
      takeaways: draft.takeaways,
      cover: art.cover,
      coverAlt: art.alt,
      deva: art.deva,
      readMinutes: readMinutesOf(draft.body),
      status: "DRAFT",
      authorId: me.id,
      authorName: me.name,
      authorRole: await bylineRole(me.id, me.role),
    },
    select: { id: true },
  });
  return NextResponse.json({ id: post.id }, { status: 201 });
}

/* ── read one ───────────────────────────────────────────────────────────── */

export async function getPost(id: string) {
  const me = await actor();
  if (!me) return NO_AUTH;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return DENY;
  // an expert may not read somebody else's draft; 404 rather than 403, so the
  // response does not confirm that the post exists
  if (me.role !== "ADMIN" && post.authorId !== me.id) return DENY;

  return NextResponse.json({ post, me: { id: me.id, role: me.role } });
}

/* ── update ─────────────────────────────────────────────────────────────── */

export async function updatePost(req: Request, id: string) {
  const me = await actor();
  if (!me) return NO_AUTH;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return DENY;
  const isAuthor = post.authorId === me.id;
  if (me.role !== "ADMIN" && !isAuthor) return DENY;

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const status = post.status as PostStatus;
  const nextStatus =
    typeof payload.status === "string" ? (payload.status as PostStatus) : null;

  /* A status change and an edit arrive on the same route but are separate
     permissions: being allowed to submit does not make a published post
     editable, and vice versa. */
  const editing = payload.title !== undefined || payload.body !== undefined;
  if (editing && !canEdit(me.role, status, isAuthor)) {
    return NextResponse.json(
      { error: "This post can no longer be edited." },
      { status: 403 }
    );
  }

  const data: Record<string, unknown> = {};

  if (editing) {
    const draft = cleanDraft(payload);
    const goingOut = nextStatus === "PUBLISHED" || status === "PUBLISHED";
    const problem = validateDraft(draft, goingOut);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });

    Object.assign(data, {
      title: draft.title,
      excerpt: draft.excerpt,
      category: draft.category,
      body: draft.body,
      takeaways: draft.takeaways,
      readMinutes: readMinutesOf(draft.body),
    });

    // the art follows the category unless an admin has set it by hand
    if (draft.category !== post.category && me.role !== "ADMIN") {
      const art = artFor(draft.category);
      Object.assign(data, { cover: art.cover, coverAlt: art.alt, deva: art.deva });
    }

    /* The slug is frozen once a post has been public: somebody may have
       shared the link, and a tidier URL is not worth a dead one. */
    if (status === "DRAFT" && !post.publishedAt && draft.title !== post.title) {
      data.slug = await uniqueSlug(draft.title, post.id);
    }
  }

  if (me.role === "ADMIN") {
    for (const field of ["cover", "coverAlt", "deva", "featured"] as const) {
      if (payload[field] !== undefined) data[field] = payload[field];
    }
  }

  if (nextStatus && nextStatus !== status) {
    if (!canMove(me.role, status, nextStatus, isAuthor)) {
      return NextResponse.json({ error: "You cannot do that to this post." }, { status: 403 });
    }

    // publishing checks the post as it will be, not as it was saved
    if (nextStatus === "PUBLISHED") {
      const candidate = editing
        ? cleanDraft(payload)
        : {
            title: post.title,
            excerpt: post.excerpt,
            category: post.category,
            body: cleanBody(post.body),
            takeaways: Array.isArray(post.takeaways) ? (post.takeaways as string[]) : [],
          };
      const problem = validateDraft(candidate, true);
      if (problem) return NextResponse.json({ error: problem }, { status: 400 });
      if (!post.publishedAt) data.publishedAt = new Date();
    }

    data.status = nextStatus;

    if (me.role === "ADMIN" && (nextStatus === "PUBLISHED" || status === "IN_REVIEW")) {
      data.reviewedById = me.id;
      data.reviewedAt = new Date();
      data.reviewNote =
        typeof payload.reviewNote === "string" ? payload.reviewNote.trim().slice(0, 1000) : null;
    }
    // a fresh submission clears the previous round of notes
    if (nextStatus === "IN_REVIEW") data.reviewNote = null;
  }

  if (!Object.keys(data).length) {
    return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
  }

  await prisma.post.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

/* ── delete ─────────────────────────────────────────────────────────────── */

export async function deletePost(id: string) {
  const me = await actor();
  if (!me) return NO_AUTH;

  const post = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true, status: true },
  });
  if (!post) return DENY;
  const isAuthor = post.authorId === me.id;
  if (me.role !== "ADMIN" && !isAuthor) return DENY;
  if (!canDelete(me.role, post.status as PostStatus, isAuthor)) {
    return NextResponse.json(
      { error: "A post that has been submitted or published cannot be deleted here." },
      { status: 403 }
    );
  }

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
