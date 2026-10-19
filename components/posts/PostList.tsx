"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { CATEGORIES, type Role } from "@/lib/post-policy";
import type { PostStatus } from "@/lib/blog";

/**
 * The list of posts in either portal.
 *
 * An expert sees their own; an admin sees everybody's, with anything waiting
 * on them pulled to the top. Which rows arrive is decided by the query on the
 * server, not by anything here — this only has to render what it is given.
 */

export type PostRowView = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: PostStatus;
  authorId: string;
  authorName: string;
  reviewNote: string | null;
  publishedAt: string | null;
  updatedAt: string;
  readMinutes: number;
};

const TONE: Record<PostStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-forest-800/[0.07] text-ink/70" },
  IN_REVIEW: { label: "In review", className: "bg-gold/25 text-gold-dark" },
  PUBLISHED: { label: "Published", className: "bg-forest-100 text-forest-800" },
  ARCHIVED: { label: "Unpublished", className: "bg-forest-800/[0.07] text-ink/55" },
};

function when(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function PostList({
  posts,
  me,
  basePath,
}: {
  posts: PostRowView[];
  me: { id: string; role: Role };
  basePath: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = basePath.startsWith("/admin") ? "/api/admin/posts" : "/api/expert/posts";

  /* A new post is created on the server before the editor opens, so the
     editor always has a real id and every save is an ordinary update. The
     alternative — a create-or-update editor — means two code paths for one
     screen, and the second one is always the buggy one. */
  async function startNew() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled post",
          excerpt: "",
          category: CATEGORIES[0],
          body: [{ type: "p", text: "" }],
          takeaways: [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not start a new post.");
        return;
      }
      router.push(`${basePath}/${data.id}`);
    } finally {
      setBusy(false);
    }
  }

  const waiting = posts.filter((p) => p.status === "IN_REVIEW");
  const rest = posts.filter((p) => p.status !== "IN_REVIEW");
  const groups =
    me.role === "ADMIN" && waiting.length
      ? [
          { title: `Waiting on you (${waiting.length})`, rows: waiting },
          { title: "Everything else", rows: rest },
        ]
      : [{ title: "", rows: posts }];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-[0.92rem] text-ink/65">
          {posts.length === 0
            ? "Nothing here yet."
            : `${posts.length} post${posts.length === 1 ? "" : "s"}.`}
        </p>
        <Button onClick={startNew} variant="gold" size="sm" disabled={busy}>
          {busy ? "Starting…" : "Write a post"}
        </Button>
      </div>

      {error && (
        <p role="alert" className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-[0.92rem] text-red-800">
          {error}
        </p>
      )}

      {posts.length === 0 && (
        <p className="rounded-xl border border-forest-800/15 bg-ivory-light px-6 py-10 text-center leading-relaxed text-ink/60">
          Posts you write appear here. Start one and it saves as a draft until
          you are ready.
        </p>
      )}

      {groups.map((g) =>
        g.rows.length ? (
          <section key={g.title || "all"} className="mb-10">
            {g.title && (
              <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/45">
                {g.title}
              </p>
            )}
            <ul className="divide-y divide-forest-800/10 rounded-xl border border-forest-800/15 bg-ivory-light">
              {g.rows.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`${basePath}/${p.id}`}
                    className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 transition-colors hover:bg-sage-light/30"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-forest-900">{p.title}</span>
                      <span className="mt-0.5 block text-[0.84rem] text-ink/55">
                        {p.category} · {p.readMinutes} min
                        {me.role === "ADMIN" && ` · ${p.authorName}`}
                        {p.status === "PUBLISHED" && ` · ${when(p.publishedAt)}`}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[0.72rem] font-semibold ${TONE[p.status].className}`}
                    >
                      {TONE[p.status].label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null
      )}
    </div>
  );
}
