"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ExpertSessionView } from "@/lib/expert-data";
import { statusMeta } from "@/lib/expert-portal";
import { cn, formatDateISO, formatINR } from "@/lib/utils";

/**
 * Requests waiting on an answer.
 *
 * Nothing has been charged and the slot is held, so the only two things worth
 * doing here are saying yes and saying no. Accepting is one press, because
 * agreeing to your own published availability should not need a dialog.
 * Declining asks for a reason first — it is kept for the record, and the
 * client is never shown it, because a line written for a file reads very
 * differently to the person it is about.
 *
 * Yellow while it waits, green once agreed, red once declined — and each one
 * also says so in words, because colour alone is no use to a screen reader or
 * to anybody who cannot tell these two apart.
 */
export default function RequestBoard({ requests }: { requests: ExpertSessionView[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, "accepted" | "declined">>({});

  async function send(id: string, action: "accept" | "decline") {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/expert/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "That didn't go through. Please try again.");
        return;
      }
      setDone((d) => ({ ...d, [id]: action === "accept" ? "accepted" : "declined" }));
      setDecliningId(null);
      setReason("");
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Nothing has changed.");
    } finally {
      setBusy(null);
    }
  }

  if (requests.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-forest-800/20 bg-ivory-light/60 p-8 text-center text-ink/65">
        No one is waiting on you. New requests land here.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {requests.map((r) => {
        const answered = done[r.id];
        const meta = statusMeta(answered === "accepted" ? "PENDING_PAYMENT" : answered === "declined" ? "DECLINED" : "REQUESTED");
        const isDeclining = decliningId === r.id;

        return (
          <li
            key={r.id}
            className={cn(
              "rounded-2xl border p-5 transition-colors",
              answered === "accepted" && "border-forest-800/20 bg-sage-light/25",
              answered === "declined" && "border-red-200 bg-red-50/50",
              !answered && "border-haldi/45 bg-haldi/[0.07]"
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={cn("rounded-full px-2.5 py-1 text-[0.72rem] font-semibold", meta.tone)}>
                    {meta.label}
                  </span>
                  {r.client.sessionsWithYou > 1 && (
                    <span className="rounded-full bg-forest-800/[0.06] px-2.5 py-1 text-[0.72rem] font-semibold text-ink/70">
                      Session {r.client.sessionsWithYou} with you
                    </span>
                  )}
                </div>
                <p className="mt-2.5 font-display text-lg font-medium text-forest-900">
                  {formatDateISO(r.date)} · {r.time}–{r.endTime}
                </p>
                <p className="mt-1 text-[0.92rem] text-ink/75">
                  {r.client.displayName} · {r.concernLabel}
                  {r.serviceTitle ? ` · ${r.serviceTitle}` : ""}
                </p>
                <p className="mt-0.5 text-[0.86rem] text-ink/60">
                  {r.amount === 0 ? "Free first session" : formatINR(r.amount)} · asked for{" "}
                  {new Intl.DateTimeFormat("en-IN", {
                    day: "numeric",
                    month: "short",
                    timeZone: "Asia/Kolkata",
                  }).format(new Date(r.bookedAt))}
                </p>
              </div>

              {!answered && !isDeclining && (
                <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => send(r.id, "accept")}
                    disabled={busy === r.id}
                    className="press rounded-full bg-forest-800 px-5 py-2.5 text-[0.88rem] font-semibold text-ivory transition-colors hover:bg-forest-900 disabled:opacity-50"
                  >
                    {busy === r.id ? "Accepting…" : "Accept"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDecliningId(r.id);
                      setError(null);
                    }}
                    disabled={busy === r.id}
                    className="press rounded-full border border-forest-800/20 px-4 py-2.5 text-[0.88rem] font-medium text-forest-800 transition-colors hover:border-red-400 hover:text-red-800 disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              )}

              {answered && (
                <p className="shrink-0 text-[0.86rem] text-ink/70">
                  {answered === "accepted"
                    ? r.amount === 0
                      ? "Confirmed. They've been told."
                      : "They've been emailed to pay."
                    : "Declined. The slot is free again."}
                </p>
              )}
            </div>

            {isDeclining && (
              <div className="mt-4 border-t border-haldi/35 pt-4">
                <label className="block text-[0.68rem] uppercase tracking-[0.14em] text-ink/55">
                  Why
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={300}
                    autoFocus
                    disabled={busy === r.id}
                    placeholder="Outside what I work with; referring on"
                    className="mt-1.5 w-full rounded-xl border border-forest-800/15 bg-ivory px-3.5 py-2.5 text-[0.9rem] normal-case tracking-normal text-forest-900 focus:border-forest-800 focus:outline-none"
                  />
                </label>
                <p className="mt-1.5 text-[0.78rem] text-ink/55">
                  For the record only. The client is told the time isn&apos;t available and that
                  nothing was charged — never your reason.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => send(r.id, "decline")}
                    disabled={busy === r.id || reason.trim().length < 4}
                    className="press rounded-full bg-red-700 px-5 py-2.5 text-[0.88rem] font-semibold text-ivory transition-colors hover:bg-red-800 disabled:opacity-50"
                  >
                    {busy === r.id ? "Declining…" : "Decline the request"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDecliningId(null);
                      setReason("");
                    }}
                    disabled={busy === r.id}
                    className="press px-3 py-2.5 text-[0.88rem] font-medium text-ink/60 transition-colors hover:text-forest-800 disabled:opacity-50"
                  >
                    Keep it
                  </button>
                </div>
              </div>
            )}

            {error && decliningId === r.id && (
              <p className="mt-3 text-[0.85rem] text-red-700">{error}</p>
            )}

            <Link
              href={`/expert/sessions/${r.id}`}
              className="link-draw mt-3 inline-block text-[0.85rem] font-medium text-forest-700"
            >
              See who this is
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
