"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { normaliseCode, type Discount } from "@/lib/coupons";
import { formatINR } from "@/lib/utils";

/**
 * The discount box on the review screen.
 *
 * Folded away behind a link by default, because an open, empty "promo code"
 * field is the single best way to make somebody leave a checkout and go
 * looking for a code they were never given.
 *
 * What it shows is only ever what the server said: the browser sends a string
 * and is told a price. The applied discount is passed back up so the booking
 * request can carry the code, where it is priced again from scratch.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export default function CodeBox({
  serviceSlug,
  expertId,
  applied,
  onApplied,
  initialValue = "",
  disabled,
}: {
  /**
   * The code is priced against this practitioner taking this service — the
   * same pair the booking route prices, so the saving shown is the saving made.
   */
  serviceSlug: string;
  expertId: string;
  applied: Discount | null;
  onApplied: (discount: Discount | null) => void;
  /** Arrived on a shared link. Filled in and checked once, never forced. */
  initialValue?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(!!initialValue);
  const [value, setValue] = useState(normaliseCode(initialValue));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    const code = normaliseCode(value);
    if (!code) {
      setError("Type a code first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/coupons/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, service: serviceSlug, expertId }),
      });
      const data = await res.json();
      if (res.ok && data.discount) {
        onApplied(data.discount as Discount);
        setError(null);
      } else {
        onApplied(null);
        setError(data.error ?? "We couldn't check that code. Try again in a moment.");
      }
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  /**
   * A code that came in on a link is checked once, on its own, so somebody who
   * followed a friend's link sees the money come off without having to guess
   * that the folded-away box was for them. Only once: re-checking on every
   * render would spend the rate limit on nothing.
   */
  const autoChecked = useRef(false);
  useEffect(() => {
    if (autoChecked.current || !initialValue || applied) return;
    autoChecked.current = true;
    void check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  if (applied) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-forest-800/10 bg-sage-light/40 px-4 py-3"
      >
        <div className="min-w-0">
          <p className="text-[0.9rem] font-semibold text-forest-800">
            <span className="font-mono">{applied.code}</span> applied &middot; &minus;
            {formatINR(applied.amount)}
          </p>
          <p className="mt-0.5 text-[0.8rem] leading-snug text-ink/70">{applied.label}</p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onApplied(null);
            setValue("");
            setOpen(true);
          }}
          className="link-draw shrink-0 text-[0.8rem] font-medium text-forest-800 disabled:opacity-50"
        >
          Remove
        </button>
      </motion.div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="link-draw mt-5 text-[0.85rem] font-medium text-forest-800 disabled:opacity-50"
      >
        Have a code?
      </button>
    );
  }

  return (
    <div className="mt-5">
      <label
        htmlFor="discount-code"
        className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-ink/70"
      >
        Discount or referral code
      </label>
      <div className="flex gap-2">
        <input
          id="discount-code"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void check();
            }
          }}
          placeholder="PRIYA-K4M2"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          disabled={busy || disabled}
          aria-invalid={!!error}
          aria-describedby={error ? "discount-code-error" : undefined}
          className="min-w-0 flex-1 rounded-xl border border-forest-800/15 bg-ivory px-4 py-2.5 font-mono text-[0.95rem] uppercase tracking-wide text-forest-900 placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-ink/60 focus:border-gold focus:outline-none"
        />
        <button
          type="button"
          onClick={check}
          disabled={busy || disabled}
          className="press shrink-0 rounded-xl border border-forest-800/25 px-5 text-[0.9rem] font-semibold text-forest-800 transition-colors hover:border-forest-800 disabled:opacity-50"
        >
          {busy ? "Checking…" : "Apply"}
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            id="discount-code-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="mt-2 text-[0.82rem] leading-relaxed text-red-700"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
