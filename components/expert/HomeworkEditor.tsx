"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_SHORT, MAX_TASK, MAX_WHY } from "@/lib/homework";

/**
 * Setting between-session work, from the session page.
 *
 * Written to be filled in during the last two minutes of a session, which is
 * the only time it will ever realistically be filled in: one line for what to
 * do, one optional line for why, and a date if it matters. The "why" field is
 * offered rather than demanded, but it is the field that decides whether the
 * task gets done, so the placeholder says so.
 */
export default function HomeworkEditor({
  sessionId,
  items,
  canSet,
}: {
  sessionId: string;
  items: {
    id: string;
    task: string;
    why: string;
    frequency: string;
    duration: string;
    dueOn: string | null;
    doneAt: string | null;
  }[];
  /** False for a cancelled session — there is nothing to practise after. */
  canSet: boolean;
}) {
  const router = useRouter();
  const [task, setTask] = useState("");
  const [why, setWhy] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const add = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/expert/sessions/${sessionId}/homework`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, why, frequency, duration, dueOn: dueOn || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setTask("");
        setFrequency("");
        setDuration("");
        setWhy("");
        setDueOn("");
        setAdding(false);
        router.refresh();
      } else {
        setError(data.error ?? "That didn't save.");
      }
    } catch {
      setError("We couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await fetch(`/api/expert/sessions/${sessionId}/homework`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeworkId: id }),
      });
      router.refresh();
    } catch {
      setError("We couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-5 sm:p-6">
      {items.length > 0 && (
        <ul className="mb-5 space-y-3">
          {items.map((h) => (
            <li
              key={h.id}
              className="flex items-start gap-4 rounded-xl border border-forest-800/10 bg-forest-800/[0.02] px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[0.94rem] leading-snug text-forest-900">{h.task}</p>
                {(h.frequency || h.duration) && (
                  <p className="mt-0.5 text-[0.84rem] text-ink/75">
                    {[h.frequency, h.duration].filter(Boolean).join(" · ")}
                  </p>
                )}
                {h.why && (
                  <p className="mt-1 text-[0.84rem] leading-relaxed text-ink/70">{h.why}</p>
                )}
                <p className="mt-1.5 text-[0.78rem] text-ink/70">
                  {h.doneAt ? "Ticked off by the client" : "Not done yet"}
                  {h.dueOn ? ` · by ${h.dueOn}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(h.id)}
                disabled={busy}
                className="link-draw shrink-0 text-[0.8rem] font-medium text-red-700 disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {!canSet ? (
        <p className="text-[0.88rem] text-ink/70">
          This session was cancelled, so there is nothing to set.
        </p>
      ) : !adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="press rounded-full border border-forest-800/25 px-5 py-2.5 text-[0.88rem] font-semibold text-forest-800 transition-colors hover:border-forest-800"
        >
          {items.length ? "Add another" : "Set something to practise"}
        </button>
      ) : (
        <div className="space-y-3">
          <div>
            <label
              htmlFor="hw-task"
              className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink/70"
            >
              What to do
            </label>
            <input
              id="hw-task"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              maxLength={MAX_TASK}
              placeholder="Write down one thought that hooks you, and both sides of the evidence."
              className="w-full rounded-xl border border-forest-800/15 bg-ivory px-4 py-2.5 text-[0.94rem] text-forest-900 placeholder:text-ink/70 focus:border-forest-800 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="hw-why"
              className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink/70"
            >
              Why it matters
            </label>
            <textarea
              id="hw-why"
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              rows={2}
              maxLength={MAX_WHY}
              placeholder="A line in your words. This is the part that decides whether it gets done."
              className="w-full resize-none rounded-xl border border-forest-800/15 bg-ivory px-4 py-2.5 text-[0.94rem] leading-relaxed text-forest-900 placeholder:text-ink/70 focus:border-forest-800 focus:outline-none"
            />
          </div>
          {/* How often and for how long. Optional — "notice when you snap at
              someone" has neither — but when they are given they turn a
              suggestion into something a person can actually follow. */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="hw-freq"
                className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink/70"
              >
                How often
              </label>
              <input
                id="hw-freq"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                maxLength={MAX_SHORT}
                placeholder="Twice a day, morning and before bed"
                className="w-full rounded-xl border border-forest-800/15 bg-ivory px-4 py-2.5 text-[0.94rem] text-forest-900 placeholder:text-ink/70 focus:border-forest-800 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="hw-dur"
                className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink/70"
              >
                For how long
              </label>
              <input
                id="hw-dur"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                maxLength={MAX_SHORT}
                placeholder="Five minutes, for two weeks"
                className="w-full rounded-xl border border-forest-800/15 bg-ivory px-4 py-2.5 text-[0.94rem] text-forest-900 placeholder:text-ink/70 focus:border-forest-800 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label
                htmlFor="hw-due"
                className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink/70"
              >
                By when
              </label>
              <input
                id="hw-due"
                type="date"
                value={dueOn}
                onChange={(e) => setDueOn(e.target.value)}
                className="rounded-xl border border-forest-800/15 bg-ivory px-3.5 py-2.5 text-[0.9rem] text-forest-900 focus:border-forest-800 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={add}
              disabled={busy || task.trim().length < 4}
              className="press rounded-full bg-forest-800 px-5 py-2.5 text-[0.88rem] font-semibold text-ivory transition-colors hover:bg-forest-700 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Set it"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
              className="link-draw text-[0.85rem] font-medium text-forest-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-[0.82rem] text-red-700">{error}</p>}
    </div>
  );
}
