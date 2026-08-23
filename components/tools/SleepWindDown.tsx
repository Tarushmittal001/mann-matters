"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A slow guided body scan for bedtime — about five minutes from settling in
 * to drifting off. Dark-toned, minimal motion, no sound. Each step holds for
 * 20–30 seconds and advances on its own; there is nothing to tap mid-way.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

type Step = { title: string; body: string; secs: number };

const steps: Step[] = [
  {
    title: "Settle in",
    body: "Adjust the pillow, pull the blanket right, and then be done adjusting. Let the bed take your full weight.",
    secs: 20,
  },
  {
    title: "Your breath",
    body: "Three slow breaths. Make each exhale a little longer than the inhale — that's the switch that tells your body it's night.",
    secs: 25,
  },
  {
    title: "Your toes and feet",
    body: "Find them without moving them. Let them go warm and heavy, like they're sinking into the mattress.",
    secs: 25,
  },
  {
    title: "Your legs",
    body: "Calves, knees, thighs. They carried you all day — let them stop working now.",
    secs: 25,
  },
  {
    title: "Your hips and lower back",
    body: "Let the bed hold them completely. You don't need to hold anything up anymore.",
    secs: 25,
  },
  {
    title: "Your belly",
    body: "Soft. Rising and falling on its own. Nothing to hold in, no one to hold it in for.",
    secs: 25,
  },
  {
    title: "Your chest",
    body: "Notice your breath has already slowed without you asking it to. Let it keep going at its own pace.",
    secs: 25,
  },
  {
    title: "Your hands and arms",
    body: "Uncurl your fingers. Heavy arms, warm palms — nothing left to type, scroll, or carry today.",
    secs: 25,
  },
  {
    title: "Your shoulders",
    body: "Let them fall away from your ears. Whatever they were braced for can wait until morning.",
    secs: 25,
  },
  {
    title: "Your jaw and face",
    body: "Teeth slightly apart. Smooth your brow. Let your tongue rest loose. Faces work hard all day too.",
    secs: 25,
  },
  {
    title: "Your eyes",
    body: "Let them rest back in their sockets, heavy behind closed lids. There's nothing left to look at.",
    secs: 25,
  },
  {
    title: "Your whole body",
    body: "Heavy, warm, held. Scan once from toes to head — if anything re-tightened, just notice it and let it soften again.",
    secs: 30,
  },
];

export default function SleepWindDown() {
  const reduce = useReducedMotion();
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    setRunning(false);
    setStep(0);
    setFinished(false);
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const start = () => {
    setFinished(false);
    setStep(0);
    setRunning(true);
  };

  useEffect(() => {
    if (!running) return;
    timer.current = setTimeout(() => {
      if (step + 1 >= steps.length) {
        setRunning(false);
        setFinished(true);
      } else {
        setStep((s) => s + 1);
      }
    }, steps[step].secs * 1000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [running, step]);

  const current = steps[step];
  const totalMins = Math.round(steps.reduce((a, s) => a + s.secs, 0) / 60);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center">
      {/* a dim moon-like orb, breathing very slowly */}
      <motion.div
        aria-hidden="true"
        className="mb-10 h-24 w-24 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 38% 32%, rgba(232,240,234,0.9), rgba(168,195,181,0.55) 55%, rgba(26,90,77,0.25) 100%)",
          boxShadow: "0 0 70px 12px rgba(168,195,181,0.18)",
        }}
        animate={reduce ? { scale: 1 } : { scale: running ? [1, 1.12, 1] : 1 }}
        transition={reduce ? { duration: 0 } : { duration: 9, repeat: running ? Infinity : 0, ease: "easeInOut" }}
      />

      {finished ? (
        <div>
          <h2 className="font-display text-3xl font-medium text-ivory">Now, drift.</h2>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-sage-light/80">
            If you&apos;re still awake, that&apos;s completely fine — staying
            this rested and heavy is nearly as good as sleep, and sleep tends to
            come for people who stop chasing it. Put the phone down, face down.
          </p>
          <button onClick={stop} className="link-draw mt-8 text-sm text-sage-light/60">
            Start over
          </button>
        </div>
      ) : !running ? (
        <div>
          <h2 className="font-display text-3xl font-medium text-ivory">Ready when you are.</h2>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-sage-light/80">
            {steps.length} slow steps, about {totalMins} minutes, from your toes
            to the top of your head. Lie down first, screen dimmed, and let the
            words do the work.
          </p>
          <button
            onClick={start}
            className="mt-8 rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-forest-950 transition-colors hover:bg-gold-dark"
          >
            Begin winding down
          </button>
        </div>
      ) : (
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0.15 : 1.4, ease: EASE }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage/70">
                {step + 1} of {steps.length}
              </p>
              <h2 className="mt-4 font-display text-3xl font-medium text-ivory">{current.title}</h2>
              <p className="mx-auto mt-4 max-w-md leading-relaxed text-sage-light/80">
                {current.body}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* quiet progress line */}
          <div className="mx-auto mt-10 h-px w-56 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <motion.div
              key={step}
              className="h-full bg-gold/70"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={reduce ? { duration: 0 } : { duration: current.secs, ease: "linear" }}
            />
          </div>

          <button onClick={stop} className={cn("link-draw mt-9 text-sm text-sage-light/50")}>
            Stop
          </button>
        </div>
      )}
    </div>
  );
}
