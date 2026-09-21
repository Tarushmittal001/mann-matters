"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Caveat } from "next/font/google";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import Avatar from "@/components/ui/Avatar";
import { testimonials as sampleStories, type Testimonial } from "@/lib/testimonials";

/*
 * One story at a time, with room to breathe — a magazine page, not a carousel.
 *
 * Built to hold any number of reviews: nothing on screen grows with the list.
 * Arrows, ← → keys and a swipe on phones move between
 * stories. A review without a portrait gets the watercolour figure from
 * <Avatar>, so real customers never leave a hole.
 *
 * Stories change on their own: a hand-drawn gold line under the story draws
 * itself as the timer, the words of each new quote blur in one after another,
 * the portrait floats gently, and a large faint quote mark swings in behind.
 * It holds still only while the pointer rests on the story itself or a control
 * has focus (hovering anywhere in the section used to freeze it, so it looked
 * static), and there is no autoplay for people who ask for reduced motion.
 */

const hand = Caveat({ subsets: ["latin"], weight: ["500"], display: "swap" });

const STORY_MS = 6000;
const EASE = [0.22, 1, 0.36, 1] as const;
const SWIPE = 70;

export default function Testimonials({ stories }: { stories?: Testimonial[] }) {
  // approved client feedback from the home page, or the sample stories
  const testimonials = stories && stories.length ? stories : sampleStories;
  const reduced = useReducedMotion();
  const count = testimonials.length;
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [run, setRun] = useState(0); // restarts the pen line
  const ref = useRef<HTMLElement>(null);

  const step = useCallback(
    (by: 1 | -1) => {
      setDir(by);
      setActive((a) => (a + by + count) % count);
      setRun((r) => r + 1);
    },
    [count]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const playing = !reduced && !paused && onScreen && count > 1;
  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => step(1), STORY_MS);
    return () => window.clearTimeout(id);
  }, [playing, active, run, step]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE) step(1);
    else if (info.offset.x > SWIPE) step(-1);
  };

  if (count === 0) return null;
  const t = testimonials[active];

  return (
    <section ref={ref} className="section relative overflow-hidden bg-sage-light/30">
      <div className="wrap-wide">
        <p className="eyebrow mb-10 flex items-center gap-3 md:mb-14">
          <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
          we heard you
        </p>

        <div
          className="mx-auto max-w-5xl"
          role="group"
          aria-roledescription="carousel"
          aria-label="Client stories"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") step(1);
            if (e.key === "ArrowLeft") step(-1);
          }}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {/* the story; drag sideways on a phone to move on */}
          <div
            className="relative min-h-[26rem] sm:min-h-[19rem]"
            aria-live="polite"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* a large faint quote mark that swings in behind each new story */}
            <AnimatePresence mode="wait">
              <motion.span
                key={`mark-${active}`}
                aria-hidden="true"
                className="pointer-events-none absolute -top-10 right-0 select-none font-display text-[11rem] leading-none text-gold/15 sm:-top-16 sm:text-[16rem]"
                initial={reduced ? false : { opacity: 0, rotate: -18, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 0.9, ease: EASE }}
              >
                &rdquo;
              </motion.span>
            </AnimatePresence>

            <AnimatePresence mode="wait" custom={dir}>
              <motion.figure
                key={active}
                custom={dir}
                className="grid cursor-grab touch-pan-y items-end gap-6 active:cursor-grabbing sm:grid-cols-[auto_1fr] sm:gap-12"
                drag={reduced ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={onDragEnd}
                variants={{
                  enter: (d: number) => ({ opacity: 0, x: d * 30 }),
                  center: { opacity: 1, x: 0 },
                  exit: (d: number) => ({ opacity: 0, x: d * -30, transition: { duration: 0.25 } }),
                }}
                initial={reduced ? false : "enter"}
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: EASE }}
              >
                {/* portrait, painted in from the bottom like a brush stroke */}
                <motion.div
                  className="pointer-events-none h-36 w-28 shrink-0 select-none sm:h-56 sm:w-44"
                  initial={reduced ? false : { clipPath: "inset(100% 0% 0% 0%)" }}
                  animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
                  transition={{ duration: 0.9, ease: EASE }}
                >
                  <motion.div
                    className="h-full w-full"
                    animate={reduced ? undefined : { y: [0, -6, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Avatar name={t.name} src={t.image} index={active} />
                  </motion.div>
                </motion.div>

                <div className="select-none">
                  <blockquote className="relative max-w-2xl font-display text-[1.5rem] leading-[1.35] text-forest-900 sm:text-[2rem] lg:text-[2.3rem]">
                    {t.quote.split(" ").map((word, i, all) => (
                      <motion.span
                        key={i}
                        className="inline-block whitespace-pre"
                        initial={reduced ? false : { opacity: 0, y: 10, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.45, delay: 0.2 + i * 0.045, ease: EASE }}
                      >
                        {word + (i < all.length - 1 ? " " : "")}
                      </motion.span>
                    ))}
                  </blockquote>
                  <motion.figcaption
                    className="mt-5 flex flex-wrap items-baseline gap-x-3"
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 + t.quote.split(" ").length * 0.045 }}
                  >
                    <span className={`${hand.className} text-2xl text-forest-700`}>— {t.name}</span>
                    <span className="text-sm text-ink/55">{t.detail}</span>
                  </motion.figcaption>
                </div>
              </motion.figure>
            </AnimatePresence>
          </div>

          {/* controls: they stay this size whether there are 6 stories or 600 */}
          {count > 1 && (
            <div className="mt-10 flex items-center gap-4 sm:gap-6">
              <Arrow direction="prev" onClick={() => step(-1)} />

              {/* the pen line: a timer while playing, a steady mark when still */}
              <svg className="h-3 w-full min-w-0 flex-1 overflow-visible" viewBox="0 0 600 12" preserveAspectRatio="none" aria-hidden="true">
                <path
                  d="M2 7 C 90 3, 180 10, 300 6 S 500 3, 598 7"
                  fill="none"
                  stroke="rgba(14,59,51,0.12)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <motion.path
                  key={`${run}-${playing}`}
                  d="M2 7 C 90 3, 180 10, 300 6 S 500 3, 598 7"
                  fill="none"
                  stroke="#C8A45D"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  initial={{ pathLength: playing ? 0 : 1 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: playing ? STORY_MS / 1000 : 0, ease: "linear" }}
                />
              </svg>

              <Arrow direction="next" onClick={() => step(1)} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Arrow({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous story" : "Next story"}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-forest-800/15 text-forest-800 transition-colors duration-300 hover:border-forest-800 hover:bg-forest-800 hover:text-ivory"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d={direction === "prev" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
