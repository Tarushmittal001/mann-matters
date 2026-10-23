"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/expert/controls";
import { MAX_DATES, TIMES_PER_DATE } from "@/lib/reschedule-offers";
import { cn } from "@/lib/utils";

/**
 * Offering the client other times when you cannot make the one you agreed to.
 *
 * Three dates, two times on each. It moves nothing — the client picks, and if
 * they never answer the original time stands, because an appointment somebody
 * is relying on should not move without them.
 */

const SLOTS = [
  { group: "Morning", times: ["08:00", "09:00", "10:00", "11:00"] },
  { group: "Afternoon", times: ["12:30", "14:00", "15:30", "16:30"] },
  { group: "Evening", times: ["18:00", "19:00", "20:00", "21:00"] },
];

type Row = { date: string; times: string[] };

export default function RescheduleOffer({
  bookingId,
  today,
  live,
}: {
  bookingId: string;
  /** Clinic date, from the server — the browser's clock is the viewer's. */
  today: string;
  /** An offer already out, if one is. */
  live: { sentAt: string; reason: string; options: { date: string; times: string[] }[] } | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([{ date: "", times: [] }]);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const set = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, n) => (n === i ? { ...r, ...patch } : r)));

  function toggleTime(i: number, t: string) {
    const row = rows[i];
    const has = row.times.includes(t);
    if (has) return set(i, { times: row.times.filter((x) => x !== t) });
    if (row.times.length >= TIMES_PER_DATE) {
      // replace the oldest rather than refusing: the cap is a shape, not a rule
      // somebody should have to undo by hand
      return set(i, { times: [row.times[1] ?? row.times[0], t].filter(Boolean) });
    }
    set(i, { times: [...row.times, t] });
  }

  const filled = rows.filter((r) => r.date && r.times.length > 0);
  const valid = filled.length > 0 && reason.trim().length >= 4;

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/expert/sessions/${bookingId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates: filled, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "That didn't send.");
        return;
      }
      setSent(true);
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Nothing was sent.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <p className="text-[0.88rem] leading-relaxed text-forest-700" role="status">
        Sent. The session stays where it is until they pick one.
      </p>
    );
  }

  if (live) {
    const when = new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      timeZone: "Asia/Kolkata",
    }).format(new Date(live.sentAt));
    return (
      <div className="text-[0.88rem] leading-relaxed text-ink/75">
        <p>
          You offered other times on {when} and they have not answered yet. The session is still
          at its original time.
        </p>
        <ul className="mt-2 space-y-1 text-[0.86rem] text-ink/70">
          {live.options.map((o) => (
            <li key={o.date}>
              {new Intl.DateTimeFormat("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                timeZone: "Asia/Kolkata",
              }).format(new Date(`${o.date}T00:00:00+05:30`))}{" "}
              — {o.times.join(" or ")}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="link-draw mt-3 text-[0.86rem] font-medium text-forest-700"
        >
          Offer different times instead
        </button>
        {open && <Form />}
      </div>
    );
  }

  if (!open) {
    return (
      <div>
        <p className="text-[0.88rem] leading-relaxed text-ink/70">
          Can&apos;t make it? Offer up to {MAX_DATES} other dates, two times on each. Nothing moves
          until they choose.
        </p>
        <div className="mt-3">
          <ActionButton tone="secondary" size="sm" onClick={() => setOpen(true)}>
            Offer other times
          </ActionButton>
        </div>
      </div>
    );
  }

  return <Form />;

  function Form() {
    return (
      <div className={live ? "mt-4 border-t border-forest-800/10 pt-4" : ""}>
        <ul className="space-y-4">
          {rows.map((row, i) => (
            <li key={i} className="rounded-xl border border-forest-800/10 bg-ivory p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-ink/70">
                  Date {i + 1}
                  <input
                    type="date"
                    value={row.date}
                    min={today}
                    onChange={(e) => set(i, { date: e.target.value })}
                    disabled={busy}
                    className="ml-2 rounded-lg border border-forest-800/15 bg-ivory-light px-2.5 py-1.5 text-[0.88rem] font-normal normal-case tracking-normal text-forest-900 focus:border-forest-800 focus:outline-none"
                  />
                </label>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRows((rs) => rs.filter((_, n) => n !== i))}
                    disabled={busy}
                    className="text-[0.8rem] text-ink/70 underline underline-offset-2 hover:text-red-700"
                  >
                    remove
                  </button>
                )}
              </div>

              {row.date && (
                <div className="mt-3 space-y-2">
                  {SLOTS.map((g) => (
                    <div key={g.group} className="flex flex-wrap items-center gap-1.5">
                      <span className="w-20 shrink-0 text-[0.75rem] uppercase tracking-[0.1em] text-ink/70">
                        {g.group}
                      </span>
                      {g.times.map((t) => {
                        const on = row.times.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTime(i, t)}
                            aria-pressed={on}
                            disabled={busy}
                            className={cn(
                              "press rounded-full border px-3 py-1.5 text-[0.82rem] font-medium transition-colors",
                              on
                                ? "border-forest-800 bg-forest-800 text-ivory"
                                : "border-forest-800/15 text-forest-800 hover:border-forest-800"
                            )}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                  <p className="text-[0.76rem] text-ink/70">
                    {row.times.length}/{TIMES_PER_DATE} chosen
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>

        {rows.length < MAX_DATES && (
          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, { date: "", times: [] }])}
            disabled={busy}
            className="link-draw mt-3 text-[0.86rem] font-medium text-forest-700"
          >
            + another date
          </button>
        )}

        <label className="mt-4 block text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-ink/70">
          Why
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            disabled={busy}
            placeholder="A clash I couldn't avoid — sorry"
            className="mt-1.5 w-full rounded-xl border border-forest-800/15 bg-ivory px-3.5 py-2.5 text-[0.9rem] font-normal normal-case tracking-normal text-forest-900 focus:border-forest-800 focus:outline-none"
          />
        </label>
        <p className="mt-1.5 text-[0.78rem] leading-relaxed text-ink/70">
          Unlike a decline, the client <strong>is</strong> shown this — their time is being moved
          and they are owed the reason.
        </p>

        {error && <p className="mt-2 text-[0.85rem] text-red-700">{error}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <ActionButton size="sm" onClick={send} busy={busy} disabled={!valid}>
            Send {filled.reduce((n, r) => n + r.times.length, 0) || ""} options
          </ActionButton>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setError(null);
            }}
            disabled={busy}
            className="text-[0.86rem] font-medium text-ink/70 transition-colors hover:text-forest-800 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }
}
