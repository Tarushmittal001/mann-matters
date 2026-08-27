"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { testimonials } from "@/lib/testimonials";

const AUTOPLAY_MS = 6000;

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

  return (
    <section className="section overflow-hidden bg-sage-light/30">
      <div className="wrap-wide">
        {/* heading: serif title + rule, echoing the reference treatment */}
        <div className="mb-12 flex items-center gap-6 md:mb-16">
          <h2 className="shrink-0 font-display text-3xl text-forest-900 md:text-4xl">
            We heard you
          </h2>
          <span className="h-px flex-1 bg-forest-800/20" aria-hidden="true" />
          <span className="hidden font-deva text-2xl text-gold-dark md:inline" aria-hidden="true">
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
              <div
                key={active}
                className="absolute inset-0 grid place-items-end motion-safe:animate-[fadein_0.7s_ease]"
              >
                <Avatar name={t.name} src={t.image} index={active} size={190} />
              </div>
            </div>

            {/* quote */}
            <figure key={active} className="motion-safe:animate-[fadein_0.7s_ease]">
              <blockquote className="max-w-measure font-display text-xl leading-relaxed text-forest-900 md:text-2xl md:leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 text-sm text-ink/65">
                <span className="font-semibold text-forest-800">{t.name}</span>
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
                className={`h-2.5 rounded-full transition-all duration-300 ease-silk ${
                  i === active
                    ? "w-6 bg-forest-700"
                    : "w-2.5 bg-forest-800/25 hover:bg-forest-800/45"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
