"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Feedback";
import { formatINR } from "@/lib/utils";

/**
 * Giving money back on one payment.
 *
 * A two-step, like blocking: the button opens a panel that says what will
 * happen and asks why. Money leaving the account on a single click is how a
 * mis-click becomes a bank transfer.
 *
 * The amount is only a suggestion from here — the server bounds it by what is
 * actually left on the payment, so a stale page cannot refund twice.
 */
export default function RefundButton({
  bookingId,
  // NOT `ref`: React 18 treats that name as a ref on a function component and
  // strips it from props, so the label would silently render empty
  bookingRef,
  max,
  alreadyBack,
  blocked,
}: {
  bookingId: string;
  bookingRef: string;
  /** What is still refundable, in whole rupees. */
  max: number;
  alreadyBack: number;
  /** Why it cannot be refunded at all, if so. */
  blocked: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(max));
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ refunded: number; payout: string | null } | null>(null);

  if (done) {
    return (
      <div className="text-right">
        <span className="inline-block rounded-full bg-sage-light/70 px-2.5 py-1 text-[0.72rem] font-semibold text-forest-800">
          {formatINR(done.refunded)} refunded
        </span>
        {done.payout && (
          <span className="mt-1 block max-w-[14rem] text-[0.72rem] leading-snug text-gold-dark">
            {done.payout}
          </span>
        )}
      </div>
    );
  }

  /* A dash, not the sentence. The payment chip in the row beside this already
     says "Awaited" or "Free session"; repeating the reason in full here was
     the widest thing in the table and pushed the date column off the edge.
     The explanation lives in the tooltip for anyone who wants it. */
  if (blocked) {
    return (
      <span className="cursor-help text-ink/30" title={blocked}>
        —
      </span>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press whitespace-nowrap rounded-full border border-forest-800/20 px-3 py-1.5 text-[0.76rem] font-semibold text-forest-800 transition-colors hover:border-forest-800"
      >
        Refund
      </button>
    );
  }

  const value = Math.trunc(Number(amount));
  const valid = Number.isFinite(value) && value > 0 && value <= max && !!reason.trim();

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.fields?.amount || data.fields?.reason || data.error || "That didn't go through.");
        return;
      }
      setDone({
        refunded: data.refunded,
        payout: data.payoutAlreadySent
          ? `${data.payoutAlreadySent.expertName}'s payout for that month was already sent — they were paid on the old figure.`
          : null,
      });
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Nothing was refunded.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-[13.5rem] text-left">
      <p className="text-[0.8rem] font-semibold text-forest-900">Refund {bookingRef}</p>
      <p className="mt-1 text-[0.74rem] leading-snug text-ink/65">
        {alreadyBack > 0 && <>{formatINR(alreadyBack)} already given back. </>}
        Up to {formatINR(max)} left. This does not cancel the session.
      </p>

      <label className="mt-2.5 block text-[0.68rem] uppercase tracking-[0.12em] text-ink/50">
        Amount
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
          inputMode="numeric"
          disabled={busy}
          autoFocus
          className="mt-1 w-full rounded-lg border border-forest-800/15 bg-ivory px-2.5 py-1.5 text-[0.85rem] normal-case tracking-normal tabular-nums text-forest-900 focus:border-forest-800 focus:outline-none"
        />
      </label>

      <label className="mt-2 block text-[0.68rem] uppercase tracking-[0.12em] text-ink/50">
        Why
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={300}
          disabled={busy}
          placeholder="Therapist didn't join"
          className="mt-1 w-full rounded-lg border border-forest-800/15 bg-ivory px-2.5 py-1.5 text-[0.85rem] normal-case tracking-normal text-forest-900 focus:border-forest-800 focus:outline-none"
        />
      </label>
      <p className="mt-1 text-[0.7rem] text-ink/50">Kept in the Trail. Never shown to the client.</p>

      {error && <p className="mt-1.5 text-[0.74rem] text-red-700">{error}</p>}

      <div className="mt-2.5 flex items-center gap-2">
        <button
          type="button"
          onClick={send}
          disabled={busy || !valid}
          className="press inline-flex items-center gap-1.5 rounded-full bg-forest-800 px-3.5 py-1.5 text-[0.76rem] font-semibold text-ivory transition-colors hover:bg-forest-900 disabled:opacity-50"
        >
          {busy && <Spinner />}
          Refund {Number.isFinite(value) && value > 0 ? formatINR(value) : ""}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={busy}
          className="text-[0.76rem] text-ink/60 transition-colors hover:text-forest-800 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
