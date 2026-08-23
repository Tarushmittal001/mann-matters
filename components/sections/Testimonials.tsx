"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { testimonials } from "@/lib/testimonials";

const AUTOPLAY_MS = 6000;

/* The carousel cycles through the palette as it cycles through people, so
   changing quote also changes the colour of the ring, the quote mark and
   the active dot. */
const HUES = [
  { c: "#F0B429", ink: "#8A5A00" },
  { c: "#E14D7C", ink: "#A82454" },
  { c: "#0E9FA6", ink: "#076166" },
  { c: "#7C4D9B", ink: "#5B3475" },
  { c: "#E36A3B", ink: "#9A3410" },
  { c: "#4356CE", ink: "#2C3A9B" },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = testimonials.length;

  const go = useCallback(
    (next: number) => setActive(((next % count) + count) % count),
    [count]
  );

  // autoplay, paused on hover/focus and when the user prefers reduced motion
  const reduced = useRef(false);
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  useEffect(() => {
    if (paused || reduced.current) return;
    const id = setInterval(() => setActive((a) => (a + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, count]);

  const t = testimonials[active];
  const hue = HUES[active % HUES.length];

  return (
    <section className="section relative overflow-hidden bg-sage-light/25">
      <div className="mesh-warm pointer-events-none absolute inset-0 opacity-90" aria-hidden="true" />
      <div className="wrap-wide relative">
        {/* heading: serif title + rule, echoing the reference treatment */}
        <div className="mb-12 flex items-center gap-6 md:mb-16">
          <h2 className="shrink-0 font-display text-3xl text-forest-900 md:text-4xl">
            We heard you
          </h2>
          <span className="rule-spectrum flex-1 opacity-80" aria-hidden="true" />
          <span className="hidden font-deva text-2xl text-kesar md:inline" aria-hidden="true">
            मन
          </span>
        </div>

        <div
          className="relative"
          role="group"
          aria-roledescription="carousel"
          aria-label="Client testimonials"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <div className="grid grid-cols-[auto,1fr] items-center gap-6 md:gap-12 lg:gap-16">
            {/* watercolor portrait, re-keyed so it fades in on change */}
            <div className="relative h-[170px] w-[150px] shrink-0 md:h-[220px] md:w-[190px]">
              <span
                className="absolute -inset-4 rounded-full blur-2xl transition-colors duration-700"
                style={{ background: `radial-gradient(circle at 50% 60%, ${hue.c}4D, transparent 70%)` }}
                aria-hidden="true"
              />
              <div
                key={active}
                className="absolute inset-0 grid place-items-end motion-safe:animate-[fadein_0.7s_ease]"
              >
                <Avatar name={t.name} src={t.image} index={active} size={190} />
              </div>
            </div>

            {/* quote */}
            <figure key={active} className="relative motion-safe:animate-[fadein_0.7s_ease]">
              <span
                className="pointer-events-none absolute -left-3 -top-12 select-none font-display text-[7rem] leading-none md:-left-6 md:text-[9rem]"
                style={{ color: `${hue.c}3D` }}
                aria-hidden="true"
              >
                &ldquo;
              </span>
              <blockquote className="relative max-w-measure font-display text-xl leading-relaxed text-forest-900 md:text-2xl md:leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 text-sm text-ink/65">
                <span className="font-semibold" style={{ color: hue.ink }}>
                  {t.name}
                </span>
                {" · "}
                {t.detail}
              </figcaption>
            </figure>
          </div>

          {/* dot pagination */}
          <div className="mt-10 flex items-center justify-center gap-2.5 md:mt-12">
            {testimonials.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show testimonial ${i + 1} of ${count}: ${item.name}`}
                aria-current={i === active}
                style={{
                  background: HUES[i % HUES.length].c,
                  opacity: i === active ? 1 : 0.32,
                }}
                className={`h-2.5 rounded-full transition-all duration-300 ease-silk hover:!opacity-70 ${
                  i === active ? "w-7" : "w-2.5"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
