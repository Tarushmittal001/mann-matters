"use client";

import { motion, useReducedMotion } from "framer-motion";
import { launchEndsLabel, savingPercent } from "@/lib/pricing";
import { cn, formatINR } from "@/lib/utils";

/**
 * A price during the launch offer: the standard price with a pen stroke drawn
 * through it, today's price beside it, and how much that saves.
 *
 * The line draws itself once when the price scrolls into view — the gesture of
 * someone crossing a number out — and simply sits there for anyone who asked
 * for reduced motion. With no `standard`, this is just the price.
 */
export default function Price({
  amount,
  standard,
  note,
  size = "md",
  tone = "light",
  className,
  showBadge = true,
}: {
  amount: number | null;
  standard: number | null;
  /** e.g. "per session" — rendered under the figures. */
  note?: string;
  size?: "sm" | "md" | "lg";
  tone?: "light" | "dark";
  className?: string;
  showBadge?: boolean;
}) {
  const reduced = useReducedMotion();

  const text = {
    sm: { now: "text-[1.05rem]", was: "text-[0.82rem]", badge: "text-[0.62rem] px-1.5 py-[1px]" },
    md: { now: "text-2xl", was: "text-[0.95rem]", badge: "text-[0.68rem] px-2 py-0.5" },
    lg: { now: "text-[2rem]", was: "text-[1.1rem]", badge: "text-[0.72rem] px-2.5 py-0.5" },
  }[size];

  const colours =
    tone === "dark"
      ? { now: "text-ivory", was: "text-sage-light/55", note: "text-sage-light/60", stroke: "#DCC28C" }
      : { now: "text-forest-900", was: "text-ink/45", note: "text-ink/55", stroke: "#B5474F" };

  if (amount === null) {
    return <span className={cn("font-display font-medium", text.now, colours.now, className)}>On request</span>;
  }

  return (
    <span className={cn("inline-flex flex-col gap-1", className)}>
      <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        {standard && (
          <span className={cn("relative inline-block font-display", text.was, colours.was)}>
            {formatINR(standard)}
            {/* the stroke, drawn by hand rather than a text-decoration line */}
            <svg
              className="pointer-events-none absolute left-[-6%] top-1/2 h-[0.7em] w-[112%] -translate-y-1/2 overflow-visible"
              viewBox="0 0 100 12"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <motion.path
                d="M1 8.5 C 22 4.5, 44 9.5, 64 6 S 88 3.5, 99 5.5"
                fill="none"
                stroke={colours.stroke}
                strokeWidth="2.2"
                strokeLinecap="round"
                initial={reduced ? false : { pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                transition={{ duration: 0.55, delay: 0.25, ease: "easeInOut", opacity: { duration: 0.01, delay: 0.25 } }}
              />
            </svg>
          </span>
        )}

        <span className={cn("font-display font-medium leading-none", text.now, colours.now)}>
          {formatINR(amount)}
        </span>

        {standard && showBadge && (
          <motion.span
            className={cn(
              "rounded-full bg-gold/20 font-semibold uppercase tracking-wide text-gold-dark",
              text.badge,
              tone === "dark" && "bg-gold/25 text-gold-light"
            )}
            initial={reduced ? false : { opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.75, type: "spring", stiffness: 380, damping: 20 }}
          >
            Save {savingPercent(standard, amount)}%
          </motion.span>
        )}
      </span>

      {(note || standard) && (
        <span className={cn("text-[0.78rem] leading-snug", colours.note)}>
          {note}
          {note && standard ? " · " : ""}
          {standard ? `launch price until ${launchEndsLabel()}` : ""}
        </span>
      )}
    </span>
  );
}
