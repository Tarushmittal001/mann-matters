"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import Avatar from "@/components/ui/Avatar";
import { REGIONS, type Region } from "@/lib/palette";
import { useLiteMotion } from "@/lib/use-lite-motion";
import type { Testimonial } from "@/lib/testimonials";

/**
 * The stories.
 *
 * ── THE SHAPE OF IT ────────────────────────────────────────────────────────
 * A portrait at the size of a person rather than a favicon, a halo of colour
 * behind it, and the quote set beside it as display type. Not centred: a
 * centred quote with a small round picture underneath is the single most
 * common testimonial layout on the web, and it was reading as exactly that.
 *
 * ── THE HALO IS THE IDEA ───────────────────────────────────────────────────
 * Each story takes one of the eight brain-region colours from `lib/palette.ts`
 * — the same eight the concerns and the services use — and that colour washes
 * the space behind the portrait and, faintly, the whole band. Moving between
 * stories tweens it, so the page changes temperature with each person. It is
 * the one thing here that could not be lifted off another site: those colours
 * already mean something on this one.
 *
 * ── THE RING IS THE TIMER ──────────────────────────────────────────────────
 * The autoplay countdown is stroked around the portrait itself rather than
 * drawn as a separate bar or a row of dots. A progress element that is also
 * the frame costs nothing in the layout, and it says the story is about to
 * change without asking you to look anywhere else.
 *
 * ── IT HAS TO WORK AT ONE ──────────────────────────────────────────────────
 * There is one approved story today. Everything that implies a sequence — the
 * ring, the arrows, the counter, the rail of other faces, the autoplay, the
 * drag — renders only from the SECOND story onwards. At one, this is a
 * portrait and a quote, and nothing on screen is a control that cannot go
 * anywhere. That was the original fault here: a full carousel around a single
 * item.
 *
 * Stories come only from approved `Feedback` rows. There are no written
 * samples: a made-up review is a fake review, however kindly written.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const STORY_MS = 7000;
const SWIPE = 70;

/* The eight, in a fixed order, so a given story always gets the same colour. */
const WHEEL: Region[] = [
  REGIONS.teal,
  REGIONS.rose,
  REGIONS.indigo,
  REGIONS.amber,
  REGIONS.mint,
  REGIONS.plum,
  REGIONS.moss,
  REGIONS.violet,
];
const tint = (r: Region, a: number) => `rgba(${r.rgb[0]},${r.rgb[1]},${r.rgb[2]},${a})`;

/**
 * The quote, arriving a word at a time out of a blur.
 *
 * Per-word rather than per-line, because a line break is a property of the
 * viewport and not of the sentence — staggering by line makes the animation
 * change shape whenever the column does. The blur is dropped on phones
 * (`useLiteMotion`): a filter on thirty spans at once is the thing that
 * actually costs frames there, and the stagger alone still reads.
 */
function Words({ text, lite, reduced }: { text: string; lite: boolean; reduced: boolean }) {
  if (reduced) return <>&ldquo;{text}&rdquo;</>;
  const words = text.split(" ");
  /*
   * The quote marks live INSIDE the first and last word's span rather than as
   * text nodes either side of the list. Each word is an inline-block, so a
   * loose closing mark is its own wrappable item and drops onto a line of its
   * own whenever the last word happens to end near the measure — which it did,
   * leaving a solitary " under the quote.
   */
  const last = words.length - 1;
  return (
    <>
      {words.map((w, i) => (
        <motion.span
          key={`${i}-${w}`}
          className="inline-block"
          initial={{ opacity: 0, y: 14, filter: lite ? "blur(0px)" : "blur(7px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.55, delay: 0.1 + i * 0.028, ease: EASE }}
        >
          {i === 0 && <>&ldquo;</>}
          {w}
          {i === last && <>&rdquo;</>}
          {i < last && <>&nbsp;</>}
        </motion.span>
      ))}
    </>
  );
}

export default function Testimonials({ stories }: { stories?: Testimonial[] }) {
  const all = stories ?? [];
  const reduced = useReducedMotion();
  const lite = useLiteMotion();
  const count = all.length;
  const many = count > 1;

  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [run, setRun] = useState(0); // restarts the ring
  const ref = useRef<HTMLElement>(null);

  const go = useCallback(
    (to: number, by: 1 | -1) => {
      setDir(by);
      setActive(((to % count) + count) % count);
      setRun((r) => r + 1);
    },
    [count]
  );
  const step = useCallback((by: 1 | -1) => go(active + by, by), [go, active]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), {
      threshold: 0.35,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const playing = many && !reduced && !paused && onScreen;

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => step(1), STORY_MS);
    return () => window.clearTimeout(id);
  }, [playing, active, run, step]);

  if (count === 0) return null;

  const t = all[active];
  const region = WHEEL[active % WHEEL.length];
  const slide = reduced ? 0 : 36;

  return (
    <section
      ref={ref}
      tabIndex={many ? 0 : undefined}
      aria-roledescription={many ? "carousel" : undefined}
      aria-label={many ? "Client stories" : undefined}
      onKeyDown={(e) => {
        if (!many) return;
        if (e.key === "ArrowRight") step(1);
        if (e.key === "ArrowLeft") step(-1);
      }}
      /* It holds still while the pointer is on it or a control inside it has
         focus. A quote that slides away mid-sentence is the whole reason
         people dislike these. */
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="section relative overflow-hidden bg-sage-light/30 focus-visible:outline-none text-[5.6px] p-[31.4px]"
    >
      {/* the colour of the person being read, across the whole band */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        animate={{
          background: `radial-gradient(ellipse 46% 62% at 24% 50%, ${tint(region, 0.22)}, transparent 72%)`,
        }}
        transition={{ duration: 1.1, ease: EASE }}
      />

      <div className="wrap-wide relative">
        <p className="eyebrow mb-12 flex items-center gap-3 md:mb-16">
          <span
            className="font-deva text-sm normal-case tracking-normal text-gold"
            aria-hidden="true"
          >
            मन
          </span>
          in their words
        </p>

        <motion.div
          className="grid items-center gap-10 lg:grid-cols-[auto_1fr] lg:gap-16"
          drag={many && !reduced ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.14}
          onDragEnd={(_: unknown, info: PanInfo) => {
            if (info.offset.x < -SWIPE) step(1);
            else if (info.offset.x > SWIPE) step(-1);
          }}
        >
          {/* ── the portrait ─────────────────────────────────────────────── */}
          <div className="relative mx-auto lg:mx-0">
            <div className="relative h-[clamp(11rem,24vw,16.5rem)] w-[clamp(11rem,24vw,16.5rem)]">
              <motion.span
                className="absolute -inset-6 rounded-full blur-2xl"
                aria-hidden="true"
                animate={{ backgroundColor: tint(region, 0.5) }}
                transition={{ duration: 0.9, ease: EASE }}
              />

              <div className="absolute inset-0 overflow-hidden rounded-full bg-ivory-light/80 ring-1 ring-forest-800/10">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active}
                    className="h-full w-full"
                    initial={reduced ? false : { opacity: 0, scale: 1.08, x: dir * 24 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={reduced ? undefined : { opacity: 0, scale: 0.96, x: dir * -24 }}
                    transition={{ duration: 0.55, ease: EASE }}
                  >
                    <Avatar name={t.name} src={t.image} index={active} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* the countdown, only when there is somewhere to count down to */}
              {playing && (
                <svg
                  className="pointer-events-none absolute -inset-[6px] -rotate-90"
                  viewBox="0 0 100 100"
                  aria-hidden="true"
                >
                  <motion.circle
                    key={run}
                    cx="50"
                    cy="50"
                    r="49"
                    fill="none"
                    stroke="#C8A45D"
                    strokeWidth="0.9"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: STORY_MS / 1000, ease: "linear" }}
                  />
                </svg>
              )}
            </div>
          </div>

          {/* ── the quote ────────────────────────────────────────────────── */}
          <div className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.figure
                key={active}
                initial={reduced ? false : { opacity: 0, x: dir * slide }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduced ? undefined : { opacity: 0, x: dir * -slide }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <blockquote className="h-display text-[1.75rem] leading-[1.22] md:text-[2.4rem] lg:text-[2.9rem]">
                  <Words text={t.quote} lite={lite} reduced={!!reduced} />
                </blockquote>

                <figcaption className="mt-8 flex items-center gap-3">
                  <span
                    className="h-px w-8 shrink-0"
                    style={{ backgroundColor: region.hex }}
                    aria-hidden="true"
                  />
                  <span>
                    <span className="font-display text-lg font-medium text-forest-900">
                      {t.name}
                    </span>
                    <span className="ml-2 text-[0.9rem] text-ink/55">{t.detail}</span>
                  </span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>

            {/* ── everyone else ──────────────────────────────────────────── */}
            {many && (
              <div className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-4">
                <ul className="flex items-center gap-3">
                  {all.map((s, i) => {
                    const on = i === active;
                    return (
                      <li
                        key={`${s.name}-${i}`}
                        className="flex h-14 w-14 items-center justify-center"
                      >
                        <button
                          type="button"
                          onClick={() => go(i, i > active ? 1 : -1)}
                          aria-label={`Story ${i + 1} of ${count}, ${s.name}`}
                          aria-current={on ? "true" : undefined}
                          className="group block focus-visible:outline-none"
                        >
                          <motion.span
                            className="block overflow-hidden rounded-full bg-ivory-light/80 ring-1 ring-forest-800/10 group-focus-visible:ring-2 group-focus-visible:ring-gold"
                            animate={{
                              width: on ? 56 : 38,
                              height: on ? 56 : 38,
                              opacity: on ? 1 : 0.48,
                              boxShadow: on
                                ? `0 0 0 2px ${WHEEL[i % WHEEL.length].hex}`
                                : "0 0 0 0px rgba(0,0,0,0)",
                            }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.4, ease: EASE }}
                          >
                            <Avatar name={s.name} src={s.image} index={i} />
                          </motion.span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <span className="ml-auto flex items-center gap-5">
                  <span className="text-[0.85rem] tabular-nums text-ink/50">
                    {active + 1} / {count}
                  </span>
                  {([-1, 1] as const).map((by) => (
                    <button
                      key={by}
                      type="button"
                      onClick={() => step(by)}
                      aria-label={by === 1 ? "Next story" : "Previous story"}
                      className="text-forest-700 transition-opacity duration-300 hover:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    >
                      <svg width="26" height="14" viewBox="0 0 26 14" fill="none" aria-hidden="true">
                        <path
                          d={by === 1 ? "M1 7h24m-8-5.5L25 7l-8 5.5" : "M25 7H1m8-5.5L1 7l8 5.5"}
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  ))}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
