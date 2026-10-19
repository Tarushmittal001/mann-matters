"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * A therapist suggesting another session.
 *
 * Phrased and built as an invitation. "Not right now" is a plain button, the
 * same weight as the other one, because a prompt you can only accept is not a
 * prompt — and a therapy service nudging somebody towards spending money is
 * exactly where that would be felt.
 */
export default function FollowUpPrompt({
  items,
}: {
  items: { id: string; expertId: string; expertName: string; message: string; sentAt: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [gone, setGone] = useState<string[]>([]);

  const live = items.filter((i) => !gone.includes(i.id));
  if (live.length === 0) return null;

  async function dismiss(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/follow-ups/${id}`, { method: "POST" });
      if (res.ok) {
        setGone((g) => [...g, id]);
        router.refresh();
      }
    } catch {
      // leaving it on screen is the right failure: nothing was lost
    } finally {
      setBusy(null);
    }
  }

  return (
    <ul className="space-y-3">
      {live.map((f) => (
        <li
          key={f.id}
          className="rounded-2xl border border-gold/40 bg-gold/[0.07] p-5 sm:p-6"
        >
          <p className="font-display text-lg font-medium text-forest-900">
            {f.expertName} suggested another session.
          </p>
          {f.message && (
            <blockquote className="mt-3 border-l-2 border-gold/60 pl-3.5 text-[0.95rem] leading-relaxed text-ink/75">
              {f.message}
            </blockquote>
          )}
          <p className="mt-3 text-[0.88rem] leading-relaxed text-ink/70">
            Nothing is booked and nothing is charged. Take it up whenever you like, or not at all.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href={`/book?expert=${f.expertId}`}
              className="press rounded-full bg-gold px-6 py-2.5 text-[0.9rem] font-semibold text-forest-950 transition-colors hover:bg-gold-dark"
            >
              Book a session
            </Link>
            <button
              type="button"
              onClick={() => dismiss(f.id)}
              disabled={busy === f.id}
              className="press rounded-full border border-forest-800/20 px-5 py-2.5 text-[0.9rem] font-medium text-forest-800 transition-colors hover:border-forest-800 disabled:opacity-50"
            >
              Not right now
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
