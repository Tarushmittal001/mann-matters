"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn, formatDateISO } from "@/lib/utils";
import type { HomeworkItem } from "@/lib/homework";

/**
 * What your therapist asked you to try, on your own dashboard.
 *
 * No streak, no percentage, no reminder that you are behind. A tick and a
 * quiet line of finished work, which is what somebody in week six actually
 * wants to see. Un-ticking is allowed and costs nothing.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export default function HomeworkList({ open, done }: { open: HomeworkItem[]; done: HomeworkItem[] }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [busy, setBusy] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  const tick = async (id: string, next: boolean) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/homework/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: next }),
      });
      if (res.ok) router.refresh();
    } catch {
      // the list still reads correctly; the tick simply didn't land
    } finally {
      setBusy(null);
    }
  };

  if (open.length === 0 && done.length === 0) return null;

  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl font-medium text-forest-900">Between sessions</h2>
      <p className="mt-2 max-w-xl text-[0.9rem] text-ink/70">
        What your therapist asked you to try. Nothing is scored, and nobody is counting.
      </p>

      {open.length > 0 ? (
        <ul className="mt-5 space-y-3">
          <AnimatePresence initial={false}>
            {open.map((h) => (
              <motion.li
                key={h.id}
                layout={!reduced}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="flex items-start gap-4 rounded-2xl border border-forest-800/10 bg-ivory-light p-5"
              >
                <button
                  type="button"
                  onClick={() => tick(h.id, true)}
                  disabled={busy === h.id}
                  aria-label={`Mark done: ${h.task}`}
                  className="press mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border border-forest-800/25 transition-colors hover:border-forest-800 disabled:opacity-50"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[1rem] leading-snug text-forest-900">{h.task}</p>
                  {(h.frequency || h.duration) && (
                    <p className="mt-1 text-[0.88rem] font-medium text-forest-800">
                      {[h.frequency, h.duration].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {h.why && (
                    <p className="mt-1.5 text-[0.88rem] leading-relaxed text-ink/70">{h.why}</p>
                  )}
                  <p className="mt-2 text-[0.78rem] text-ink/70">
                    From your session with {h.expertName} on {formatDateISO(h.sessionDate)}
                    {h.dueOn ? ` · by ${formatDateISO(h.dueOn)}` : ""}
                    <Link
                      href={`/plan/${h.bookingId}`}
                      className="link-draw ml-2 font-medium text-forest-700"
                    >
                      see the plan
                    </Link>
                  </p>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-forest-800/20 bg-ivory-light/60 p-8 text-center text-[0.92rem] text-ink/70">
          Nothing outstanding. {done.length > 0 && "You've done everything that was set."}
        </p>
      )}

      {done.length > 0 && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="link-draw text-[0.85rem] font-medium text-forest-800"
          >
            {showDone ? "Hide what you've done" : `What you've done (${done.length})`}
          </button>

          <AnimatePresence>
            {showDone && (
              <motion.ul
                initial={reduced ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="mt-4 space-y-2 overflow-hidden"
              >
                {done.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-start gap-4 rounded-xl border border-forest-800/[0.08] bg-sage-light/25 px-4 py-3"
                  >
                    <button
                      type="button"
                      onClick={() => tick(h.id, false)}
                      disabled={busy === h.id}
                      aria-label={`Mark not done: ${h.task}`}
                      className={cn(
                        "press mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border border-forest-800 bg-forest-800 text-ivory disabled:opacity-50"
                      )}
                    >
                      <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path
                          d="M3 7.5 5.8 10.3 11 4.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <p className="text-[0.92rem] leading-snug text-ink/70 line-through">{h.task}</p>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
