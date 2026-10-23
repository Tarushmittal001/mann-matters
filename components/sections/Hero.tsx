"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import TalkToManuButton from "@/components/layout/TalkToManuButton";

/* Decoration: it fades in after the headline anyway, so loading it with the
   page would only delay the words and the booking button. */
const NeuralBrain = dynamic(() => import("@/components/three/NeuralBrain"), {
  ssr: false,
});

/**
 * The hero.
 *
 * ── WHY THIS IS A GRID AND NOT A STACK OF ABSOLUTE LAYERS ──────────────────
 * The previous hero could not be aligned, and no amount of tuning would have
 * fixed it: the artwork was `absolute inset-y-0 right-0` and the words sat in
 * a separate flow layer on top of it. Two independent coordinate systems
 * cannot share a baseline, so every "move it up a bit" was a number typed by
 * hand that the next viewport width undid.
 *
 * It is one grid now, with `items-center`. The two columns share a vertical
 * centre because the browser computes it, at every width, for free.
 *
 * ── THE BRAIN IS HERE, WITHOUT ITS LABELS ──────────────────────────────────
 * `labels={false}`. The eight concern words live in `Concerns.tsx` now, and
 * that is what lets the brain come back without the two problems it had.
 *
 * It was never really too big. It was the brain PLUS a reserved label column
 * on each side, and `brainScale` sized the silhouette down until the widest
 * word on each side fitted — so a 742px figure was mostly margin held for
 * text. With the labels off, the shape takes the whole cell and the drawing
 * is larger while the thing occupies less of the page.
 *
 * It also stops reading as a medical diagram. A word set against a point on a
 * silhouette is a labelled anatomical figure however the join is drawn; with
 * nothing named, the same artwork is just a mind, lighting up.
 */

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
    <section className="relative overflow-hidden">
      {/* soft sage wash, pulled to the photograph's side */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 55% 50% at 76% 44%, rgba(168,195,181,0.30), transparent 70%), radial-gradient(ellipse 38% 34% at 10% 86%, rgba(200,164,93,0.10), transparent 70%)",
        }}
      />

      {/*
        `items-center` is the whole alignment fix. The 1fr / 1.04fr split gives
        the photograph a little more room than the words without ever letting
        it dominate — the old brain ran 742px against a 430px text column,
        which is why it read as decoration with a caption attached.
      */}
      <div className="wrap-wide relative z-10 grid items-center gap-14 pb-20 pt-28 md:pt-32 lg:min-h-[86svh] lg:grid-cols-[1fr_1.04fr] lg:gap-20 lg:pb-24">
        {/* ── the words ──────────────────────────────────────────────────── */}
        <div>
          <motion.p
            className="eyebrow mb-6 flex items-center gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          >
            <span
              className="font-deva text-base normal-case tracking-normal text-gold"
              aria-hidden="true"
            >
              मन
            </span>
            therapy, counselling &amp; psychiatry, online
          </motion.p>

          {/*
            Capped at 3.4rem rather than 3.75rem. Nothing crowds the headline
            any more, so the cap is no longer a truce with the artwork — it is
            chosen against the body copy below it, which rose to 1.25rem. The
            old hero fell 60 → 18 → 15px in 120px of vertical space; three
            drops that steep make the message read like a caption.
          */}
          <h1 className="h-display text-[clamp(2.4rem,5.4vw,3.4rem)]">
            <MaskedWords text="your" baseDelay={0.2} />{" "}
            <MaskedWords text="emotions" baseDelay={0.29} className="italic text-forest-600" />
            <br />
            <MaskedWords text="matter." baseDelay={0.4} className="italic text-forest-600" />
          </h1>

          <motion.div
            className="mt-7 max-w-[30rem]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.95, ease: EASE }}
          >
            <p className="text-[1.0625rem] leading-relaxed text-ink/65 md:text-[1.25rem] w-[501px]">
              <span className="font-medium text-forest-900">
                Emoraa is an online therapy and psychiatry platform.
              </span>{" "}
              Certified psychologists and psychiatrists, one to one over video —
              for anxiety, low mood, family, relationships, work and sleep, and
              medication when you need it.
            </p>

            <p className="mt-6 border-t border-forest-800/12 pt-5 text-[0.95rem] leading-relaxed text-ink/70">
              <span className="font-medium text-forest-900">First session free</span>
              <span className="mx-2 text-ink/30">·</span>
              then from <span className="font-medium text-forest-900">₹599</span>
              <span className="mx-2 text-ink/30">·</span>
              in <span className="font-medium text-forest-900">your language</span>
            </p>
          </motion.div>

          <motion.div
            /* A grid rather than a flex row so the two calls to action are one
               matched pair: equal-fraction tracks under `w-fit` both settle at
               the wider button's width, and the default stretch gives them the
               taller one's height. */
            className="mt-9 grid w-fit auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.15, ease: EASE }}
          >
            <Button href="/book" variant="gold" size="sm" className="h-full w-full">
              Book a session
            </Button>
            <TalkToManuButton className="h-full w-full" />
          </motion.div>
        </div>

        {/* ── the brain ─────────────────────────────────────────────────── */}
        <motion.div
          /* A grid cell, NOT `absolute inset-y-0 right-0` as before. That is
             the alignment fix: the brain and the words are two columns of one
             row, so the browser gives them a shared vertical centre at every
             width instead of me typing offsets that the next breakpoint undid.

             The height is explicit because the canvas sizes itself to its box
             and a `h-full` child of an auto-height grid cell has no box to
             read. These values keep it close to square with the text column
             rather than towering over it. */
          className="relative -mx-4 h-[320px] sm:h-[420px] lg:mx-0 lg:h-[clamp(26rem,42vw,34rem)]"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.5, ease: EASE }}
          style={{ willChange: "opacity, transform" }}
        >
          <NeuralBrain labels={false} />
        </motion.div>
      </div>
    </section>
  );
}
