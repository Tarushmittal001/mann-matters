"use client";

import Image from "next/image";
import { useState } from "react";
import Reveal from "@/components/ui/Reveal";
import PackBuilder from "@/components/organisations/PackBuilder";
import { segments } from "@/lib/organisations";

/**
 * The six institution types, each with a photograph of the room the program
 * actually goes into.
 *
 * The Devanagari mark moved from the card corner onto the image, where it has a
 * dark ground to sit on — as a faint watermark over ivory it was close to
 * invisible, and it is the one piece of the brand these cards carry.
 *
 * Each card ends in its own "Build a pack" trigger, which opens the composer
 * with that institution type already chosen. A single dialog serves all six;
 * only the pre-selected segment changes.
 */
export default function SegmentGrid() {
  const [openFor, setOpenFor] = useState<string | null>(null);

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {segments.map((s, i) => (
          <Reveal key={s.id} delay={0.06 * (i % 3)} className="h-full">
            <article className="card-lift group relative flex h-full flex-col overflow-hidden rounded-2xl border border-forest-800/10 bg-ivory-light shadow-lift">
              {/* the room this program goes into */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-forest-900/5">
                <Image
                  src={s.image}
                  alt={s.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-[900ms] ease-silk group-hover:scale-[1.04]"
                />
                {/* keeps the Devanagari legible over any photograph */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-forest-950/75 via-forest-950/15 to-transparent"
                  aria-hidden="true"
                />
                <span
                  className="pointer-events-none absolute bottom-3 right-4 select-none font-deva text-[2.4rem] leading-none text-ivory/70 transition-colors duration-500 group-hover:text-gold"
                  aria-hidden="true"
                >
                  {s.deva}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-7">
                <h3 className="font-display text-xl font-medium leading-snug text-forest-900">
                  {s.name}
                </h3>
                <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold-dark">
                  {s.who}
                </p>
                <p className="mt-4 text-[0.93rem] leading-relaxed text-ink/70">{s.pressure}</p>

                <ul className="space-y-2.5 pt-6">
                  {s.offering.map((o) => (
                    <li key={o} className="flex gap-3 text-[0.88rem] leading-relaxed text-ink/65">
                      <span
                        className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold"
                        aria-hidden="true"
                      />
                      {o}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-7">
                  <button
                    type="button"
                    onClick={() => setOpenFor(s.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-forest-800/20 px-5 py-2.5 text-[0.85rem] font-semibold text-forest-800 transition-all duration-300 ease-silk hover:border-forest-800 hover:bg-forest-800 hover:text-ivory"
                  >
                    Build a pack for us
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden="true"
                      className="transition-transform duration-300 ease-silk group-hover:translate-x-0.5"
                    >
                      <path
                        d="M2 7h10M8 3l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <span
                className="absolute inset-x-0 bottom-0 h-[3px] w-0 bg-gold transition-all duration-700 ease-silk group-hover:w-full"
                aria-hidden="true"
              />
            </article>
          </Reveal>
        ))}
      </div>

      <PackBuilder
        open={openFor !== null}
        onClose={() => setOpenFor(null)}
        initialSegment={openFor ?? undefined}
      />
    </>
  );
}
