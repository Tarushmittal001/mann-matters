"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TOOL_ICONS, ToolEmblem } from "@/components/icons/ToolIcons";
import { railTools } from "@/lib/tools";

/**
 * The rest of the toolkit, on one horizontally scrolling shelf so every free
 * tool is reachable from the home page without a second click. The scrollbar is
 * deliberately visible (see `.rail` in globals.css) — arrows alone leave people
 * unsure there is more to the right.
 */
export default function ToolRail() {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [sync]);

  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(280, el.clientWidth * 0.8), behavior: "smooth" });
  };

  const arrow =
    "grid h-9 w-9 place-items-center rounded-full border border-forest-800/20 text-forest-800 transition-all duration-300 hover:border-forest-800 hover:bg-forest-800 hover:text-ivory disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="mt-16">
      <div className="mb-5 flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow">the rest of the toolkit</p>
          <p className="mt-2 text-[0.95rem] text-ink/60">
            Seven more, all free and all private. Scroll through.
          </p>
        </div>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <button type="button" onClick={() => nudge(-1)} disabled={atStart} aria-label="Scroll tools left" className={arrow}>
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M11.5 4.5 6 10l5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" onClick={() => nudge(1)} disabled={atEnd} aria-label="Scroll tools right" className={arrow}>
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M8.5 4.5 14 10l-5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={ref}
        onScroll={sync}
        className="rail -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:px-0"
        role="group"
        aria-label="All free tools"
        tabIndex={0}
      >
        {railTools.map((tool) => {
          const Icon = TOOL_ICONS[tool.icon];
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="card-lift group flex w-[15.5rem] shrink-0 snap-start flex-col rounded-2xl border border-forest-800/10 bg-ivory-light p-6 shadow-lift"
            >
              <div className="flex items-start justify-between">
                <ToolEmblem>
                  <Icon size={32} />
                </ToolEmblem>
                <span className="rounded-full bg-sage-light/60 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-forest-700">
                  {tool.time}
                </span>
              </div>
              <h3 className="mt-5 font-display text-[1.15rem] font-medium leading-snug text-forest-900">
                {tool.title}
              </h3>
              <p className="mt-2 flex-1 text-[0.88rem] leading-relaxed text-ink/60">{tool.short}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-gold-dark">
                Open
                <span className="transition-transform duration-500 ease-silk group-hover:translate-x-1" aria-hidden="true">
                  →
                </span>
              </span>
            </Link>
          );
        })}

        {/* the shelf ends where the full index begins */}
        <Link
          href="/tools"
          className="card-lift group flex w-[15.5rem] shrink-0 snap-start flex-col justify-between rounded-2xl border border-dashed border-forest-800/25 bg-transparent p-6"
        >
          <span className="font-deva text-2xl text-gold" aria-hidden="true">
            मन
          </span>
          <span>
            <span className="block font-display text-[1.15rem] font-medium leading-snug text-forest-900">
              All free tools
            </span>
            <span className="mt-2 block text-[0.88rem] leading-relaxed text-ink/60">
              The full index, with what each one is best for.
            </span>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-forest-800">
              Browse
              <span className="transition-transform duration-500 ease-silk group-hover:translate-x-1" aria-hidden="true">
                →
              </span>
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}
