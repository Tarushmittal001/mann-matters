"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PRESETS, type Range } from "@/lib/admin-period";
import { cn } from "@/lib/utils";

/**
 * The time filter: presets for the usual questions, a range for the rest.
 *
 * ── WHY IT LIVES IN THE URL ────────────────────────────────────────────────
 * The presets are links, not buttons, so a view can be sent to somebody,
 * bookmarked and reloaded, and so the counting happens in the database rather
 * than by shipping every row to the browser to filter. The custom range does
 * the same thing — it just builds the URL from two date inputs first.
 *
 * ── WHY NATIVE DATE INPUTS ─────────────────────────────────────────────────
 * `<input type="date">` brings the platform's own calendar, keyboard support
 * and locale for free, and adds nothing to the bundle. A hand-built picker
 * here would be a dependency and a month of edge cases to re-earn what the
 * browser already does.
 *
 * `extra` carries any other filter already in the URL (a grain, a status) so
 * changing the dates does not silently reset it.
 */
export default function PeriodPicker({
  range,
  today,
  extra = {},
  className,
}: {
  range: Range;
  /** Today in clinic time, from the server. The browser's own clock is in the
      visitor's timezone, and a picker that lets an admin in London choose
      "tomorrow" because it is still today in IST is a bug waiting to be
      filed. */
  today: string;
  extra?: Record<string, string>;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const custom = range.preset === "custom";

  const [open, setOpen] = useState(custom);
  const [from, setFrom] = useState(custom ? (range.from ?? "") : "");
  const [to, setTo] = useState(custom ? range.to : "");

  const href = (params: Record<string, string>) => {
    const q = new URLSearchParams({ ...extra, ...params });
    return `${pathname}?${q.toString()}`;
  };

  function apply() {
    if (!from && !to) return;
    router.push(href({ ...(from ? { from } : {}), ...(to ? { to } : {}) }));
  }

  return (
    <div className={className}>
      <nav aria-label="Time period" className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <Link
            key={p.value}
            href={href({ period: p.value })}
            aria-current={!custom && p.value === range.preset ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              !custom && p.value === range.preset
                ? "border-forest-800 bg-forest-800 text-ivory"
                : "border-forest-800/15 text-forest-800 hover:border-forest-800"
            )}
          >
            {p.label}
          </Link>
        ))}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            custom
              ? "border-forest-800 bg-forest-800 text-ivory"
              : "border-forest-800/15 text-forest-800 hover:border-forest-800"
          )}
        >
          {custom ? range.label : "Pick dates"}
          <span aria-hidden="true" className={cn("ml-2 inline-block text-[0.7em]", open && "rotate-180")}>
            ▾
          </span>
        </button>
      </nav>

      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
          className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-forest-800/10 bg-ivory-light p-4"
        >
          <label className="text-[0.68rem] uppercase tracking-[0.14em] text-ink/50">
            From
            <input
              type="date"
              value={from}
              max={to || today}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 block rounded-xl border border-forest-800/15 bg-ivory px-3 py-2 text-[0.9rem] normal-case tracking-normal text-forest-900 focus:border-forest-800 focus:outline-none"
            />
          </label>
          <label className="text-[0.68rem] uppercase tracking-[0.14em] text-ink/50">
            To
            <input
              type="date"
              value={to}
              min={from || undefined}
              max={today}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 block rounded-xl border border-forest-800/15 bg-ivory px-3 py-2 text-[0.9rem] normal-case tracking-normal text-forest-900 focus:border-forest-800 focus:outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={!from && !to}
            className="press rounded-full bg-forest-800 px-5 py-2 text-[0.85rem] font-semibold text-ivory transition-colors hover:bg-forest-900 disabled:opacity-40"
          >
            Apply
          </button>

          {custom && (
            <Link
              href={href({ period: "month" })}
              className="press rounded-full px-3 py-2 text-[0.85rem] font-medium text-ink/60 transition-colors hover:text-forest-800"
            >
              Clear
            </Link>
          )}

          <p className="w-full text-[0.78rem] leading-relaxed text-ink/55">
            Both ends are included, in clinic time (IST). Leave one blank for everything before or
            after the other.
          </p>
        </form>
      )}
    </div>
  );
}
