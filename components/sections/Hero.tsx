"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import NeuralBrain from "@/components/three/NeuralBrain";
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

        <h1 className="h-display max-w-4xl text-[clamp(3rem,8vw,7rem)]">
          <MaskedWords text="your" baseDelay={0.2} />{" "}
          <MaskedWords
            text="mann matters."
            baseDelay={0.4}
            className="italic text-forest-600"
          />
        </h1>

        <motion.p
          className="mt-8 max-w-xl text-lg leading-relaxed text-ink/70 md:text-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0, ease: EASE }}
        >
          Book a 50-minute video session with a licensed psychologist — in
          Hindi, English or Hinglish, from ₹599. Between sessions, Manu listens
          free on WhatsApp, and every tool here works without an account.
        </motion.p>

        <motion.div
          className="pointer-events-auto mt-10 flex flex-wrap items-center gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.25, ease: EASE }}
        >
          <Button href="/book" variant="gold">
            Book a session
          </Button>
          <TalkToManuButton />
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
        <span className="text-[0.65rem] uppercase tracking-[0.3em] text-forest-800/50">scroll</span>
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
