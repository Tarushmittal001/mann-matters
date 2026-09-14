"use client";

import Image from "next/image";
import { useState } from "react";
import Reveal from "@/components/ui/Reveal";
import PackBuilder from "@/components/organisations/PackBuilder";
import { segments } from "@/lib/organisations";
import { regionForSegment, rgba } from "@/lib/palette";

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
 *
 * Each card wears one of the brain regions from the home page, exactly as the
 * service cards on /services do — set once as a CSS variable on the article and
 * read by everything inside, with the mapping in lib/palette.ts.
 */
export default function SegmentGrid() {
  const [openFor, setOpenFor] = useState<string | null>(null);

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {segments.map((s, i) => {
          const region = regionForSegment(s.id);
          return (
            <Reveal key={s.id} delay={0.06 * (i % 3)} className="h-full">
              <article
                title={`${region.name} — ${region.emotion}`}
                style={{
                  ["--accent" as string]: region.hex,
                  ["--accent-soft" as string]: rgba(region.rgb, 0.14),
                }}
                className="card-lift group relative flex h-full flex-col overflow-hidden rounded-2xl border border-forest-800/10 bg-ivory-light shadow-lift"
              >
                {/* the region's colour, as a rule across the top of the card */}
                <span
                  className="absolute inset-x-0 top-0 z-10 h-[3px] bg-[color:var(--accent)]"
                  aria-hidden="true"
                />

                {/* the room this program goes into */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-forest-900/5">
                  <Image
                    src={s.image}
                    alt={s.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-[900ms] ease-silk group-hover:scale-[1.04]"
                  />
                  {/* keeps the Devanagari legible over any photograph, and tints
                      the foot of the image with the card's region */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-forest-950/20 to-transparent"
                    aria-hidden="true"
                  />
                  <div
                    className="absolute inset-0 opacity-70 transition-opacity duration-700 ease-silk group-hover:opacity-100"
                    aria-hidden="true"
                    style={{
                      background: "linear-gradient(to top, var(--accent) -10%, transparent 55%)",
                      mixBlendMode: "multiply",
                    }}
                  />
                  <span
                    className="pointer-events-none absolute bottom-3 right-4 select-none font-deva text-[2.4rem] leading-none text-ivory/70 transition-colors duration-500 group-hover:text-[color:var(--accent)]"
                    aria-hidden="true"
                  >
                    {s.deva}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-7">
                  <h3 className="font-display text-xl font-medium leading-snug text-forest-900">
                    {s.name}
                  </h3>
                  <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                    {s.who}
                  </p>
                  <p className="mt-4 text-[0.93rem] leading-relaxed text-ink/70">{s.pressure}</p>

                  <ul className="space-y-2.5 pt-6">
                    {s.offering.map((o) => (
                      <li key={o} className="flex gap-3 text-[0.88rem] leading-relaxed text-ink/65">
                        <span
                          className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[color:var(--accent)]"
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
                      className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/35 px-5 py-2.5 text-[0.85rem] font-semibold text-forest-800 transition-all duration-300 ease-silk hover:border-[color:var(--accent)] hover:bg-[color:var(--accent)] hover:text-ivory"
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
                  className="absolute inset-x-0 bottom-0 h-[3px] w-0 bg-[color:var(--accent)] transition-all duration-700 ease-silk group-hover:w-full"
                  aria-hidden="true"
                />
              </article>
            </Reveal>
          );
        })}
      </div>

      <PackBuilder
        open={openFor !== null}
        onClose={() => setOpenFor(null)}
        initialSegment={openFor ?? undefined}
      />
    </>
  );
}
