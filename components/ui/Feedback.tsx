"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The four states every screen in this product needs a house style for:
 * waiting, nothing-here-yet, something-went-wrong, and that-worked.
 *
 * Each one is announced as well as drawn — a spinner nobody hears is not a
 * loading state for everyone.
 */

/* ---------------------------------------------------------------- loading */

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <svg
        viewBox="0 0 24 24"
        className={cn("h-4 w-4 animate-spin motion-reduce:animate-none", className)}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.2" fill="none" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className={label ? undefined : "sr-only"}>{label ?? "Loading"}</span>
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block animate-pulse rounded-xl bg-forest-800/[0.07] motion-reduce:animate-none",
        className
      )}
    />
  );
}

/** A stand-in for a booking card while the real one loads. */
export function BookingCardSkeleton() {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-forest-800/10 bg-ivory-light p-6 shadow-lift sm:flex-row sm:items-center">
      <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2.5">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-36" />
      </div>
      <Skeleton className="h-9 w-28 rounded-full" />
    </div>
  );
}

/* ------------------------------------------------------------------ empty */

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-forest-800/20 bg-ivory-light/60 p-10 text-center">
      <p className="font-display text-lg font-medium text-forest-900">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink/55">{body}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------ alert / note */

type Tone = "error" | "warning" | "success" | "info";

const tones: Record<Tone, { wrap: string; icon: string; path: string }> = {
  error: {
    wrap: "border-red-200 bg-red-50 text-red-800",
    icon: "fill-red-600",
    path: "M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 3.5a.85.85 0 0 1 .85.85v4.3a.85.85 0 0 1-1.7 0v-4.3A.85.85 0 0 1 10 5.5Zm0 8.6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z",
  },
  warning: {
    wrap: "border-gold/40 bg-gold/10 text-forest-900",
    icon: "fill-gold-dark",
    path: "M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 3.5a.85.85 0 0 1 .85.85v4.3a.85.85 0 0 1-1.7 0v-4.3A.85.85 0 0 1 10 5.5Zm0 8.6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z",
  },
  success: {
    wrap: "border-forest-600/25 bg-sage-light/40 text-forest-900",
    icon: "fill-forest-700",
    path: "M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm4.03 5.53-4.9 5.2a.85.85 0 0 1-1.25 0L5.97 10.7a.85.85 0 0 1 1.24-1.16l1.3 1.39 4.28-4.55a.85.85 0 0 1 1.24 1.16Z",
  },
  info: {
    wrap: "border-forest-800/15 bg-forest-100/50 text-forest-900",
    icon: "fill-forest-600",
    path: "M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm-.9 3.9h1.8v5.2H9.1Z",
  },
};

export function Alert({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const t = tones[tone];
  const urgent = tone === "error" || tone === "warning";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      // errors interrupt; everything else waits its turn
      role={urgent ? "alert" : "status"}
      aria-live={urgent ? "assertive" : "polite"}
      className={cn("rounded-2xl border px-4 py-3.5", t.wrap, className)}
    >
      <div className="flex items-start gap-2.5">
        <svg viewBox="0 0 20 20" className={cn("mt-[3px] h-4 w-4 shrink-0", t.icon)} aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" d={t.path} />
        </svg>
        <div className="min-w-0 flex-1 text-[0.9rem] leading-relaxed">
          {title && <p className="font-semibold">{title}</p>}
          <div className={cn(title && "mt-1 opacity-90")}>{children}</div>
          {action && <div className="mt-3 flex flex-wrap gap-3">{action}</div>}
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------------------------------------------------------- crisis */

/**
 * The escape hatch. It appears at every point in the journey where someone
 * might be waiting — choosing a therapist, holding a slot, staring at a
 * dashboard with nothing on it — because the honest answer to "I need help
 * now" is never "your session is on Thursday".
 */
export function CrisisLine({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.85rem] leading-relaxed text-ink/60",
        className
      )}
    >
      <span aria-hidden="true" className="text-gold-dark">
        ◆
      </span>
      Need someone right now, before your session?
      <a
        href="tel:14416"
        className="font-semibold text-forest-800 underline underline-offset-2 hover:text-forest-600"
      >
        Call Tele-MANAS 14416
      </a>
      <span className="text-ink/35">·</span>
      <Link href="/crisis" className="link-draw font-medium text-forest-800">
        More crisis support
      </Link>
    </p>
  );
}
