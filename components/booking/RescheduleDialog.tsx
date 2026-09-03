"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { Alert, Spinner } from "@/components/ui/Feedback";
import SlotPicker, { type SlotSelection } from "@/components/booking/SlotPicker";
import { MAX_RESCHEDULES, canReschedule, changePolicyNote } from "@/lib/features/booking/policy";
import type { SerializedBooking } from "@/lib/features/booking/server";

/**
 * Moving a session, in a dialog rather than a new page — losing the dashboard
 * behind you to change one time is a jarring amount of ceremony.
 *
 * The payment doesn't move with it because nothing about it changes: the same
 * session, at a different hour.
 */
export default function RescheduleDialog({ booking }: { booking: SerializedBooking }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState<SlotSelection>({ date: "", time: null });
  const [refreshToken, setRefreshToken] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const allowed = canReschedule(booking);
  const remaining = MAX_RESCHEDULES - booking.rescheduleCount;

  // escape closes; focus lands somewhere sensible on open
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, busy]);

  const submit = async () => {
    if (!slot.date || !slot.time) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/${booking.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: slot.date, time: slot.time }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409 && data.code === "SLOT_TAKEN") {
        setError(data.error);
        setSlot((s) => ({ date: s.date, time: null }));
        setRefreshToken((t) => t + 1);
        setBusy(false);
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "We couldn't move that session. Please try again.");
        setBusy(false);
        return;
      }

      setOpen(false);
      setBusy(false);
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Please check your connection and try again.");
      setBusy(false);
    }
  };

  if (!allowed.ok) {
    // the reason is worth showing — a missing button just looks broken
    return (
      <span
        className="text-[0.8rem] text-ink/40"
        title={allowed.reason}
        aria-label={allowed.reason}
      >
        Can&apos;t be moved
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="link-draw text-sm font-medium text-forest-800 hover:text-forest-600"
      >
        Reschedule
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-forest-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !busy && setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="reschedule-title"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[calc(100dvh-1rem)] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-3xl border border-forest-800/10 bg-ivory-light p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-bloom sm:max-h-[92vh] sm:rounded-3xl sm:p-7"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="eyebrow mb-2">move your session</p>
                  <h2 id="reschedule-title" className="font-display text-2xl font-medium text-forest-900">
                    A new time with {booking.expertName}
                  </h2>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => !busy && setOpen(false)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink/50 transition-colors hover:bg-forest-800/5 hover:text-forest-900"
                  aria-label="Close"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-ink/60">
                {changePolicyNote} You have {remaining} {remaining === 1 ? "move" : "moves"} left on
                this session — your payment stays as it is.
              </p>

              {error && (
                <Alert tone="warning" className="mt-5">
                  {error}
                </Alert>
              )}

              <div className="mt-6">
                <SlotPicker
                  expertId={booking.expertId}
                  value={slot}
                  onChange={setSlot}
                  refreshToken={refreshToken}
                  currentSlot={{ date: booking.date, time: booking.time }}
                  compact
                />
              </div>

              <div className="mt-8 flex flex-col-reverse items-stretch gap-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-end">
                <button
                  type="button"
                  onClick={() => !busy && setOpen(false)}
                  className="min-h-11 px-4 text-sm font-medium text-ink/55 hover:text-forest-900"
                >
                  Never mind
                </button>
                <Button
                  onClick={submit}
                  variant="gold"
                  disabled={busy || !slot.date || !slot.time}
                >
                  {busy ? <Spinner label="Moving your session…" /> : "Move my session"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
