"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Feedback";
import { formatINR } from "@/lib/utils";

/**
 * Recording that a practitioner has actually been paid.
 *
 * The amount is not sent from here — the server recomputes it from the month's
 * sessions. This component only carries who and which month, so a stale page
 * cannot record a figure that was true ten minutes ago.
 */
export default function MarkPayout({
  expertId,
  expertName,
  month,
  due,
  settled,
}: {
  expertId: string;
  expertName: string;
  month: string;
  due: number;
  settled: { amount: number; paidAt: string; reference: string | null } | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(undo = false) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expertId, month, reference, undo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "That didn't save.");
        return;
      }
      setOpen(false);
      setReference("");
      router.refresh();
    } catch {
      setError("We couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  if (settled) {
    const when = new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      timeZone: "Asia/Kolkata",
    }).format(new Date(settled.paidAt));
    /* The recorded amount is shown, and the current figure beside it when they
       differ — a refund landing after payday is exactly the gap worth seeing,
       and silently showing only one of the two numbers hides it. */
    return (
      <div className="text-right">
        <span className="inline-block rounded-full bg-sage-light/70 px-2.5 py-1 text-[0.72rem] font-semibold text-forest-800">
          Paid {when}
        </span>
        {settled.amount !== due && (
          <span className="mt-1 block text-[0.72rem] text-gold-dark">
            sent {formatINR(settled.amount)}, now owed {formatINR(due)}
          </span>
        )}
        {settled.reference && (
          <span className="mt-0.5 block truncate font-mono text-[0.7rem] text-ink/50">
            {settled.reference}
          </span>
        )}
        <button
          type="button"
          onClick={() => send(true)}
          disabled={busy}
          className="mt-1 text-[0.72rem] text-ink/50 underline underline-offset-2 transition-colors hover:text-red-700 disabled:opacity-50"
        >
          undo
        </button>
        {error && <span className="mt-1 block text-[0.72rem] text-red-700">{error}</span>}
      </div>
    );
  }

  if (!open) {
    return (
      <div className="text-right">
        <span className="inline-block rounded-full bg-gold/25 px-2.5 py-1 text-[0.72rem] font-semibold text-gold-dark">
          Awaited
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={due === 0}
          className="press mt-1.5 block w-full rounded-full border border-forest-800/20 px-3 py-1.5 text-[0.76rem] font-semibold text-forest-800 transition-colors hover:border-forest-800 disabled:opacity-40"
        >
          Mark sent
        </button>
      </div>
    );
  }

  return (
    <div className="min-w-[11rem] text-right">
      <label className="block text-[0.68rem] uppercase tracking-[0.12em] text-ink/50">
        Reference
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          maxLength={80}
          disabled={busy}
          placeholder="UTR, cheque no."
          autoFocus
          className="mt-1 w-full rounded-lg border border-forest-800/15 bg-ivory px-2.5 py-1.5 text-right text-[0.8rem] normal-case tracking-normal text-forest-900 focus:border-forest-800 focus:outline-none"
        />
      </label>
      <p className="mt-1.5 text-[0.72rem] text-ink/60">
        Records {formatINR(due)} to {expertName.split(" ")[0]}.
      </p>
      {error && <p className="mt-1 text-[0.72rem] text-red-700">{error}</p>}
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={busy}
          className="text-[0.76rem] text-ink/60 transition-colors hover:text-forest-800 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => send(false)}
          disabled={busy}
          className="press inline-flex items-center gap-1.5 rounded-full bg-forest-800 px-3 py-1.5 text-[0.76rem] font-semibold text-ivory transition-colors hover:bg-forest-900 disabled:opacity-50"
        >
          {busy && <Spinner />}
          Confirm
        </button>
      </div>
    </div>
  );
}
