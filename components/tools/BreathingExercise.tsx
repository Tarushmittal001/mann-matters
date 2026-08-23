"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A guided box-breathing widget: the orb grows on the inhale, holds, shrinks on
 * the exhale, and holds again — four counts each. Calming, hypnotic, and the
 * most on-brand interaction we have. Respects reduced motion.
 */

type Phase = { label: string; sub: string; scale: number; dur: number; ease: "easeInOut" | "linear" };

const PHASES: Phase[] = [
  { label: "Breathe in", sub: "slowly, through your nose", scale: 1, dur: 4, ease: "easeInOut" },
  { label: "Hold", sub: "let it sit, gently", scale: 1, dur: 4, ease: "linear" },
  { label: "Breathe out", sub: "soften, through your mouth", scale: 0.58, dur: 4, ease: "easeInOut" },
  { label: "Hold", sub: "rest here a moment", scale: 0.58, dur: 4, ease: "linear" },
];

export default function BreathingExercise({ tone = "light" }: { tone?: "light" | "dark" }) {
  const reduce = useReducedMotion();
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [cycles, setCycles] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dark = tone === "dark";

  const stop = useCallback(() => {
    setRunning(false);
    setPhase(0);
    setCycles(0);
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // advance through the phases while running
  useEffect(() => {
    if (!running) return;
    const p = PHASES[phase];
    timer.current = setTimeout(() => {
      setPhase((prev) => {
        const next = (prev + 1) % PHASES.length;
        if (next === 0) setCycles((c) => c + 1);
        return next;
      });
    }, p.dur * 1000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [running, phase]);

  const current = PHASES[phase];
  const targetScale = reduce ? 0.85 : running ? current.scale : 0.7;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
        {/* soft outer rings */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border",
            dark ? "border-white/10" : "border-forest-800/10"
          )}
        />
        <div
          className={cn(
            "absolute inset-8 rounded-full border",
            dark ? "border-white/10" : "border-forest-800/10"
          )}
        />

        {/* the breathing orb */}
        <motion.div
          className="h-44 w-44 rounded-full sm:h-52 sm:w-52"
          style={{
            background: dark
              ? "radial-gradient(circle at 35% 30%, #DCC28C, #C8A45D 55%, #1A5A4D 100%)"
              : "radial-gradient(circle at 35% 30%, #E8F0EA, #A8C3B5 55%, #247261 100%)",
            boxShadow: dark
              ? "0 20px 60px -10px rgba(200,164,93,0.4)"
              : "0 20px 60px -10px rgba(36,114,97,0.35)",
          }}
          animate={{ scale: targetScale }}
          transition={
            reduce
              ? { duration: 0 }
              : running
                ? { duration: current.dur, ease: current.ease }
                : { duration: 1.2, ease: "easeInOut" }
          }
        />

        {/* centred cue */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className={cn("font-display text-2xl font-medium", dark ? "text-ivory" : "text-forest-900")}>
            {running ? current.label : "Ready?"}
          </p>
          <p className={cn("mt-1 text-sm", dark ? "text-sage-light/75" : "text-ink/60")}>
            {running ? current.sub : "four counts each, in and out"}
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={() => (running ? stop() : setRunning(true))}
          className={cn(
            "rounded-full px-7 py-3 text-sm font-semibold transition-colors duration-300",
            dark
              ? "bg-gold text-forest-950 hover:bg-gold-dark"
              : "bg-forest-800 text-ivory hover:bg-forest-700"
          )}
        >
          {running ? "Stop" : "Begin breathing"}
        </button>
        <p className={cn("text-sm tabular-nums", dark ? "text-sage-light/60" : "text-ink/55")}>
          {cycles} {cycles === 1 ? "round" : "rounds"}
        </p>
      </div>
    </div>
  );
}
