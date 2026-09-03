"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Alert, Spinner } from "@/components/ui/Feedback";
import { canCancel, refundFor } from "@/lib/features/booking/policy";
import { cn, formatINR } from "@/lib/utils";
import type { SerializedBooking } from "@/lib/features/booking/server";

/**
 * Cancelling, with the consequence shown before the decision.
 *
 * The refund line is computed from the same policy the server uses, so the
 * number quoted in the confirmation is the number that will actually be
 * refunded — the server recomputes it rather than trusting this, but the two
 * agree because they read the same function.
 */
export default function CancelBookingButton({ booking }: { booking: SerializedBooking }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowed = canCancel(booking);
  if (!allowed.ok) return null;

  const due = refundFor(booking, booking.payment?.status ?? null);

  const onCancel = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "We couldn't cancel that just now. Please try again.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Please check your connection and try again.");
      setBusy(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="link-draw text-sm font-medium text-ink/55 transition-colors hover:text-red-700"
      >
        Cancel session
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-forest-800/10 bg-ivory p-4 text-sm sm:min-w-[19rem]"
    >
      {error ? (
        <Alert tone="error">{error}</Alert>
      ) : (
        <>
          <p className="font-medium text-forest-900">Cancel this session?</p>
          <p className="mt-1.5 leading-relaxed text-ink/60">{due.note}</p>
          {due.amount > 0 && (
            <p className="mt-1.5 font-semibold text-forest-800">
              Refund: {formatINR(due.amount)}
            </p>
          )}
        </>
      )}

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className={cn(
            "rounded-full bg-red-700 px-4 py-2 text-[0.85rem] font-semibold text-white transition-colors hover:bg-red-800",
            busy && "opacity-60"
          )}
        >
          {busy ? <Spinner label="Cancelling…" /> : "Yes, cancel"}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          disabled={busy}
          className="text-[0.85rem] font-medium text-ink/55 hover:text-forest-900"
        >
          Keep it
        </button>
      </div>
    </motion.div>
  );
}
