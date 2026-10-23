"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * The client answering a practitioner who needs to move their session.
 *
 * "Keep my time" sits beside the options with the same weight, because the
 * original appointment is still theirs and saying no to all six is a real
 * answer, not a failure to engage.
 */
export default function RescheduleOfferCard({
  bookingId,
  expertName,
  was,
  reason,
  options,
  expiresAt,
}: {
  bookingId: string;
  expertName: string;
  was: string;
  reason: string;
  options: { date: string; times: string[] }[];
  expiresAt: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taken, setTaken] = useState<string[]>([]);
  const [done, setDone] = useState<"moved" | "kept" | null>(null);

  const day = (d: string) =>
    new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Asia/Kolkata",
    }).format(new Date(`${d}T00:00:00+05:30`));

  async function send(payload: { date?: string; time?: string; keep?: boolean }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/reschedule-offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "SLOT_TAKEN" && payload.date && payload.time) {
          setTaken((t) => [...t, `${payload.date} ${payload.time}`]);
        }
        setError(data.error || "That didn't work. Please try again.");
        return;
      }
      setDone(payload.keep ? "kept" : "moved");
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Nothing has changed.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-forest-800/15 bg-sage-light/25 p-5 sm:p-6" role="status">
        <p className="font-display text-lg font-medium text-forest-900">
          {done === "moved" ? "Moved. Your new time is confirmed." : "Kept. Your original time stands."}
        </p>
        <p className="mt-1.5 text-[0.88rem] text-ink/70">
          Nothing further has been charged{done === "moved" ? " — the fee carries over." : "."}
        </p>
      </div>
    );
  }

  const until = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(expiresAt));

  return (
    <div className="rounded-2xl border border-gold/45 bg-gold/[0.07] p-5 sm:p-6">
      <p className="font-display text-lg font-medium text-forest-900">
        {expertName} needs to move your session.
      </p>
      <p className="mt-1.5 text-[0.9rem] text-ink/75">
        It was <span className="font-medium text-forest-800">{was}</span>.
      </p>
      <blockquote className="mt-3 border-l-2 border-gold/60 pl-3.5 text-[0.95rem] leading-relaxed text-ink/75">
        {reason}
      </blockquote>

      <p className="mt-5 text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-ink/70">
        Times that would work instead
      </p>
      <div className="mt-3 space-y-3">
        {options.map((o) => (
          <div key={o.date}>
            <p className="text-[0.9rem] font-medium text-forest-900">{day(o.date)}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {o.times.map((t) => {
                const gone = taken.includes(`${o.date} ${t}`);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => send({ date: o.date, time: t })}
                    disabled={busy || gone}
                    className={cn(
                      "press rounded-full border px-4 py-2 text-[0.9rem] font-medium transition-colors",
                      gone
                        ? "border-forest-800/10 text-ink/35 line-through"
                        : "border-forest-800/25 text-forest-800 hover:border-forest-800 hover:bg-forest-800 hover:text-ivory"
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-[0.88rem] text-red-700">{error}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gold/30 pt-4">
        <button
          type="button"
          onClick={() => send({ keep: true })}
          disabled={busy}
          className="press rounded-full border border-forest-800/25 px-5 py-2.5 text-[0.9rem] font-medium text-forest-800 transition-colors hover:border-forest-800 disabled:opacity-50"
        >
          Keep my original time
        </button>
        <p className="text-[0.82rem] leading-relaxed text-ink/70">
          None of these suit? Keeping it is a real answer — your time is still yours. Otherwise
          this offer lapses on {until} and nothing changes.
        </p>
      </div>
    </div>
  );
}
