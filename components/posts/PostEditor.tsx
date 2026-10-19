"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { Field, TextArea, Select } from "@/components/ui/Field";
import {
  CATEGORIES,
  EXCERPT_MAX,
  TITLE_MAX,
  movesFor,
  type Role,
} from "@/lib/post-policy";
import type { PostStatus } from "@/lib/blog";
import type { PostBlock } from "@/lib/posts";

/**
 * Writing and reviewing a post. Used by both portals.
 *
 * The buttons along the bottom are not hardcoded per portal — they come from
 * `movesFor(role, status, isAuthor)`, the same function the API uses to decide
 * whether a move is allowed. So the screen can only ever offer what the server
 * would accept, and adding a transition in one place adds it in both.
 *
 * The body is edited as a list of blocks rather than as rich text. The public
 * article renders exactly three things — paragraph, subheading, pull quote —
 * so a full editor would mostly be a way to produce markup the site then
 * throws away.
 */

export type EditablePost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  body: PostBlock[];
  takeaways: string[];
  status: PostStatus;
  authorId: string;
  authorName: string;
  reviewNote: string | null;
  publishedAt: string | null;
};

const BLOCK_LABEL: Record<PostBlock["type"], string> = {
  p: "Paragraph",
  h2: "Subheading",
  quote: "Quote",
};

export default function PostEditor({
  post,
  me,
  basePath,
}: {
  post: EditablePost;
  me: { id: string; role: Role };
  /** "/expert/posts" or "/admin/posts" — where this editor lives. */
  basePath: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [category, setCategory] = useState(post.category);
  const [body, setBody] = useState<PostBlock[]>(
    post.body.length ? post.body : [{ type: "p", text: "" }]
  );
  const [takeaways, setTakeaways] = useState<string[]>(
    post.takeaways.length ? post.takeaways : [""]
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isAuthor = post.authorId === me.id;
  const moves = movesFor(me.role, post.status, isAuthor);
  const readOnly =
    me.role !== "ADMIN" && !(isAuthor && ["DRAFT", "IN_REVIEW"].includes(post.status));

  const api = `${basePath.startsWith("/admin") ? "/api/admin" : "/api/expert"}/posts/${post.id}`;

  async function send(status?: PostStatus) {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(api, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          excerpt,
          category,
          body: body.filter((b) => b.text.trim()),
          takeaways: takeaways.filter((t) => t.trim()),
          ...(status ? { status } : {}),
          ...(status && note.trim() ? { reviewNote: note } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "That did not save.");
        return;
      }
      setSaved(true);
      router.refresh();
      if (status) router.push(basePath);
    } finally {
      setBusy(false);
    }
  }

  const setBlock = (i: number, patch: Partial<PostBlock>) =>
    setBody((prev) => prev.map((b, n) => (n === i ? ({ ...b, ...patch } as PostBlock) : b)));

  return (
    <div className="space-y-8">
      {/* what the reviewer said, if it came back */}
      {post.reviewNote && post.status === "DRAFT" && (
        <div className="rounded-xl border-l-2 border-gold bg-ivory-dark/60 px-5 py-4">
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-gold-dark">
            sent back for changes
          </p>
          <p className="mt-2 leading-relaxed text-ink/80">{post.reviewNote}</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Title"
          value={title}
          onChange={setTitle}
          maxLength={TITLE_MAX}
          disabled={readOnly}
          required
        />
        <Select
          label="Category"
          value={category}
          onChange={setCategory}
          disabled={readOnly}
          required
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
      </div>

      <TextArea
        label="Short summary"
        hint="One or two sentences. This is what shows on the blog index and in search results."
        value={excerpt}
        onChange={setExcerpt}
        maxLength={EXCERPT_MAX}
        rows={3}
        disabled={readOnly}
      />

      {/* ── the article ───────────────────────────────────────────────── */}
      <div>
        <p className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ink/70">
          the article
        </p>
        <div className="mt-4 space-y-4">
          {body.map((block, i) => (
            <div key={i} className="rounded-xl border border-forest-800/15 bg-ivory-light p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <select
                  value={block.type}
                  disabled={readOnly}
                  onChange={(e) => setBlock(i, { type: e.target.value as PostBlock["type"] })}
                  className="rounded-lg border border-forest-800/20 bg-ivory px-3 py-1.5 text-[0.82rem] text-forest-900"
                >
                  {(Object.keys(BLOCK_LABEL) as PostBlock["type"][]).map((t) => (
                    <option key={t} value={t}>
                      {BLOCK_LABEL[t]}
                    </option>
                  ))}
                </select>
                {!readOnly && body.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setBody((p) => p.filter((_, n) => n !== i))}
                    className="text-[0.82rem] text-ink/70 hover:text-forest-900"
                  >
                    Remove
                  </button>
                )}
              </div>
              <textarea
                value={block.text}
                disabled={readOnly}
                rows={block.type === "p" ? 5 : 2}
                onChange={(e) => setBlock(i, { text: e.target.value })}
                className="w-full rounded-lg border border-forest-800/15 bg-ivory px-4 py-3 leading-relaxed text-ink/85 focus:border-forest-800/40 focus:outline-none"
              />
            </div>
          ))}
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setBody((p) => [...p, { type: "p", text: "" }])}
            className="link-draw mt-4 text-[0.9rem] font-medium text-forest-700"
          >
            Add a block
          </button>
        )}
      </div>

      {/* ── takeaways ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ink/70">
          the short version
        </p>
        <p className="mt-1 text-[0.86rem] text-ink/70">
          Two or three lines, for a reader who needs the point before the essay.
        </p>
        <div className="mt-4 space-y-2.5">
          {takeaways.map((t, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={t}
                disabled={readOnly}
                onChange={(e) =>
                  setTakeaways((prev) => prev.map((x, n) => (n === i ? e.target.value : x)))
                }
                className="w-full rounded-lg border border-forest-800/15 bg-ivory px-4 py-2.5 text-[0.92rem] text-ink/85 focus:border-forest-800/40 focus:outline-none"
              />
              {!readOnly && takeaways.length > 1 && (
                <button
                  type="button"
                  onClick={() => setTakeaways((p) => p.filter((_, n) => n !== i))}
                  className="shrink-0 px-2 text-[0.82rem] text-ink/70 hover:text-forest-900"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        {!readOnly && takeaways.length < 6 && (
          <button
            type="button"
            onClick={() => setTakeaways((p) => [...p, ""])}
            className="link-draw mt-3 text-[0.9rem] font-medium text-forest-700"
          >
            Add a line
          </button>
        )}
      </div>

      {/* a note travels with the decision, so the author knows why */}
      {me.role === "ADMIN" && post.status === "IN_REVIEW" && (
        <TextArea
          label="Note to the author"
          hint="Shown to them if you send it back. Say what needs to change."
          value={note}
          onChange={setNote}
          rows={3}
        />
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-[0.92rem] text-red-800">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="text-[0.9rem] text-forest-700">Saved.</p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-forest-800/15 pt-6">
        {!readOnly && (
          <Button onClick={() => send()} variant="outline" size="sm" disabled={busy}>
            {busy ? "Saving…" : "Save draft"}
          </Button>
        )}
        {moves.map((m) => (
          <Button
            key={`${m.to}-${m.label}`}
            onClick={() => send(m.to)}
            variant={m.to === "PUBLISHED" ? "gold" : "outline"}
            size="sm"
            disabled={busy}
          >
            {m.label}
          </Button>
        ))}
        {post.status === "PUBLISHED" && (
          <a
            href={`/blog/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="link-draw text-[0.9rem] font-medium text-forest-700"
          >
            View it live →
          </a>
        )}
      </div>
    </div>
  );
}
