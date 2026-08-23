"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import AuroraMesh from "@/components/ui/AuroraMesh";
import NeuralBrain from "@/components/three/NeuralBrain";
import { site } from "@/lib/site";

const EASE = [0.22, 1, 0.36, 1] as const;

/* Four promises, one colour each — the first place the accent family
   shows up, so the eye learns the palette before it needs it. */
const chips = [
  { label: "RCI-licensed psychologists", c: "#0E9FA6" },
  { label: "End-to-end encrypted", c: "#4356CE" },
  { label: "From ₹599 a session", c: "#F0B429" },
  { label: "Hindi, English & 10 more", c: "#E14D7C" },
];

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
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-ivory">
      {/* the colour field — six lights drifting behind everything */}
      <AuroraMesh intensity={0.34} />

      {/* the 3D form — off-axis right on desktop, ambient behind text on mobile */}
      <motion.div
        className="absolute inset-y-0 right-0 w-full opacity-40 md:w-[55%] md:opacity-100"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, delay: 0.55, ease: EASE }}
        style={{ willChange: "opacity, transform" }}
      >
        <NeuralBrain />
      </motion.div>

      {/* ivory scrim keeps the headline legible where it meets the orb */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden w-[62%] md:block"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, #F7F4EE 0%, rgba(247,244,238,0.97) 42%, rgba(247,244,238,0.80) 64%, rgba(247,244,238,0) 100%)",
        }}
      />

      <div className="wrap-wide pointer-events-none relative z-10 pb-20 pt-32">
        <motion.p
          className="eyebrow mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
        >
          <span
            className="font-deva text-base normal-case tracking-normal text-kesar"
            aria-hidden="true"
          >
            मन
          </span>
          therapy &amp; counselling, made for India
        </motion.p>

        <h1 className="h-display max-w-4xl text-[clamp(3rem,8vw,7rem)]">
          <MaskedWords text="your" baseDelay={0.2} />{" "}
          <MaskedWords
            text="mann matters."
            baseDelay={0.4}
            className="text-sunrise italic"
          />
        </h1>

        <motion.p
          className="mt-8 max-w-xl text-lg leading-relaxed text-ink/70 md:text-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0, ease: EASE }}
        >
          Talk to a licensed psychologist — online, in your language, from
          ₹599. For the exam pressure, the burnout, the heartbreak, and the
          things you haven&apos;t said out loud yet.
        </motion.p>

        <motion.div
          className="pointer-events-auto mt-10 flex flex-wrap items-center gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.25, ease: EASE }}
        >
          <Button href="/book" variant="sunrise">
            Book a session
          </Button>
          <Button href={site.whatsapp} external variant="outline">
            Talk to us on WhatsApp
          </Button>
        </motion.div>

        {/* colour-coded promises */}
        <motion.ul
          className="mt-10 flex max-w-xl flex-wrap gap-x-5 gap-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          {chips.map((chip) => (
            <li
              key={chip.label}
              className="flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-3.5 py-1.5 text-[0.78rem] font-medium text-ink/70 shadow-glass backdrop-blur-md"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: chip.c, boxShadow: `0 0 0 3px ${chip.c}22` }}
                aria-hidden="true"
              />
              {chip.label}
            </li>
          ))}
        </motion.ul>
      </div>

      {/* scroll cue, on a spectrum thread */}
      <motion.div
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        aria-hidden="true"
      >
        <span className="text-[0.65rem] uppercase tracking-[0.3em] text-forest-800/50">
          scroll
        </span>
        <motion.span
          className="block h-10 w-[3px] rounded-full"
          style={{
            background: "linear-gradient(180deg,#F0B429,#E14D7C,#4356CE)",
            transformOrigin: "top",
          }}
          animate={{ scaleY: [1, 0.4, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
