"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Button from "@/components/ui/Button";

/**
 * The hero canvas is decoration: `aria-hidden`, and it fades in over 1.6s after
 * a half-second delay anyway. Loading it with the page only delays the headline
 * and the booking button, which are what someone actually came for — so it
 * arrives on its own, after them.
 */
const NeuralBrain = dynamic(() => import("@/components/three/NeuralBrain"), {
  ssr: false,
});
import TalkToManuButton from "@/components/layout/TalkToManuButton";

const EASE = [0.22, 1, 0.36, 1] as const;

function MaskedWords({
  text,
  className,
  baseDelay = 0,
}: {
  text: string;
  className?: string;
  baseDelay?: number;
}) {
  return (
    <span className={className}>
      {text.split(" ").map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "115%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: baseDelay + i * 0.09, ease: EASE }}
          >
            {word}
          </motion.span>
          {i < text.split(" ").length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

export default function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden">
      {/* soft sage wash behind the orb */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 78% 42%, rgba(168,195,181,0.35), transparent 70%), radial-gradient(ellipse 40% 35% at 12% 88%, rgba(200,164,93,0.10), transparent 70%)",
        }}
      />

      {/*
        The 3D form — off-axis right on desktop, ambient behind text on mobile.

        The width here and the headline's clamp are one setting, not two. The
        brain grows as this percentage grows, but its left-hand labels travel
        left with it, so they run into the headline; a longer headline eats the
        same gap from the other side. 61% with a 3.75rem cap was measured as the
        largest brain that still leaves every word at least 42px clear of the
        hero text, across 1280–2560. Change one and re-measure both.
      */}
      <motion.div
        className="absolute inset-y-0 right-0 w-full opacity-40 md:w-[61%] md:opacity-100"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, delay: 0.55, ease: EASE }}
        style={{ willChange: "opacity, transform" }}
      >
        <NeuralBrain />
      </motion.div>

      {/* ivory scrim keeps the headline legible where it meets the orb */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden w-[48%] md:block"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, #F7F4EE 0%, #F7F4EE 42%, rgba(247,244,238,0.85) 64%, rgba(247,244,238,0) 100%)",
        }}
      />

      <div className="wrap-wide pointer-events-none relative z-10 pb-20 pt-32">
        <motion.p
          className="eyebrow mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
        >
          <span className="font-deva text-base normal-case tracking-normal text-gold" aria-hidden="true">
            मन
          </span>
          therapy & counselling, made for India
        </motion.p>

        <h1 className="h-display max-w-4xl text-[clamp(2.25rem,6vw,3.75rem)]">
          {/* "your" stays upright; "emotions" and "matter." carry the accent
              together. Two instances rather than one, because MaskedWords
              styles a whole string — the delays continue the 0.09s per-word
              stagger across the split so the break is invisible. */}
          <MaskedWords text="your" baseDelay={0.2} />{" "}
          <MaskedWords
            text="emotions"
            baseDelay={0.29}
            className="italic text-forest-600"
          />
          {/* the second line always breaks, so it never runs into the brain */}
          <br />
          <MaskedWords
            text="matter."
            baseDelay={0.4}
            className="italic text-forest-600"
          />
        </h1>

        <motion.div
          className="mt-8 max-w-md"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0, ease: EASE }}
        >
          {/*
            What Emoraa is, in the first six words.

            This line used to describe the service ("private video sessions
            with certified psychologists") without ever naming it, so a first
            visit could end without knowing what the site was. It says the
            thing now, then lists what people actually arrive with — the list
            is what carries "wide range", and it does it with words a reader
            does not have to work at.
          */}
          <p className="text-lg leading-snug text-ink/70 md:text-xl">
            <span className="font-medium text-forest-900">
              Emoraa is an online therapy platform for India.
            </span>{" "}
            Certified psychologists, one to one over video — for anxiety, low
            mood, family, relationships, work and sleep.
          </p>

          {/*
            The terms, in one line.

            This was three large coloured numerals in a row, which is the stat
            block every landing page has — and it stopped making sense once two
            of the three values stopped being numbers. They are not parallel
            facts either: an offer, a price and a promise about language. One
            quiet line states them without pretending they are a dataset, and
            lets the left column be the calm half of a hero that already has a
            700px brain in it.
          */}
          <p className="mt-7 border-b border-forest-800/15 pb-5 text-[0.95rem] leading-relaxed text-ink/70">
            <span className="font-medium text-forest-900">First session free</span>
            <span className="mx-2 text-ink/30">·</span>
            then from <span className="font-medium text-forest-900">₹599</span>
            <span className="mx-2 text-ink/30">·</span>
            in <span className="font-medium text-forest-900">your language</span>
          </p>
        </motion.div>

        <motion.div
          /* `w-fit`: without it this row is a full-width invisible strip
             with pointer events on, and it swallowed clicks anywhere across
             the hero at its height — including on the brain beside it.

             A grid rather than a flex row so the two calls to action are one
             matched pair: equal-fraction tracks under `w-fit` both settle at
             the wider button's width, and the default stretch gives them the
             taller one's height. Sizing them by hand would need re-measuring
             every time either label changes. */
          className="pointer-events-auto mt-10 grid w-fit auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.25, ease: EASE }}
        >
          <Button href="/book" variant="gold" size="sm" className="h-full w-full">
            Book a session
          </Button>
          <TalkToManuButton className="h-full w-full" />
        </motion.div>
      </div>

      {/* scroll cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        aria-hidden="true"
      >
        <span className="text-[0.75rem] uppercase tracking-[0.3em] text-forest-800/50">scroll</span>
        <motion.span
          className="block h-10 w-px bg-forest-800/30"
          animate={{ scaleY: [1, 0.4, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "top" }}
        />
      </motion.div>
    </section>
  );
}
