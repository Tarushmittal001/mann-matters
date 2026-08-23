"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Guided progressive muscle relaxation: tense each muscle group for five
 * seconds, release for ten, working from the hands down to the feet.
 * Roughly two and a half minutes end to end. Respects reduced motion.
 */

const TENSE_SECS = 5;
const RELEASE_SECS = 10;

type Group = { name: string; tense: string; release: string };

const groups: Group[] = [
  {
    name: "Hands",
    tense: "Make tight fists with both hands",
    release: "Let your fingers fall open, soft and heavy",
  },
  {
    name: "Arms",
    tense: "Bend your elbows and tense your arms",
    release: "Let them drop and rest, loose at your sides",
  },
  {
    name: "Shoulders",
    tense: "Lift your shoulders up toward your ears",
    release: "Let them melt back down, away from your ears",
  },
  {
    name: "Face",
    tense: "Scrunch your eyes, nose, and forehead",
    release: "Smooth everything out — soft eyes, soft brow",
  },
  {
    name: "Jaw",
    tense: "Press your lips together, clench gently",
    release: "Unclench. Let your jaw hang slightly open",
  },
  {
    name: "Chest",
    tense: "Take a deep breath in and hold it",
    release: "Breathe all the way out, slow and long",
  },
  {
    name: "Stomach",
    tense: "Tighten your belly like bracing for a nudge",
    release: "Soften your belly completely",
  },
  {
    name: "Legs",
    tense: "Squeeze your thighs and press your knees together",
    release: "Let your legs feel heavy, sinking down",
  },
  {
    name: "Feet",
    tense: "Curl your toes down toward the floor",
    release: "Uncurl. Wiggle them once, then let them rest",
  },
];

type Phase = "tense" | "release";

export default function MuscleRelaxation() {
  const reduce = useReducedMotion();
  const [running, setRunning] = useState(false);
  const [groupIdx, setGroupIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("tense");
  const [secondsLeft, setSecondsLeft] = useState(TENSE_SECS);
  const [finished, setFinished] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    setRunning(false);
    setGroupIdx(0);
    setPhase("tense");
    setSecondsLeft(TENSE_SECS);
    if (timer.current) clearInterval(timer.current);
  }, []);

  const start = () => {
    setFinished(false);
    setGroupIdx(0);
    setPhase("tense");
    setSecondsLeft(TENSE_SECS);
    setRunning(true);
  };

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1;
        // phase over — move to release, or on to the next group
        if (phase === "tense") {
          setPhase("release");
          return RELEASE_SECS;
        }
        if (groupIdx + 1 >= groups.length) {
          setRunning(false);
          setFinished(true);
          return TENSE_SECS;
        }
        setGroupIdx((g) => g + 1);
        setPhase("tense");
        return TENSE_SECS;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running, phase, groupIdx]);

  const group = groups[groupIdx];
  const tensing = phase === "tense";

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-forest-800/10 bg-ivory-light p-8 shadow-lift sm:p-10">
      {/* group progress */}
      <div className="mb-8 flex items-center gap-1.5" aria-hidden="true">
        {groups.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-500",
              i < groupIdx || finished ? "bg-gold" : i === groupIdx && running ? "bg-forest-600" : "bg-forest-800/10"
            )}
          />
        ))}
      </div>

      {finished ? (
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-forest-600">
            All done
          </p>
          <h3 className="mt-3 font-display text-3xl font-medium text-forest-900">
            Notice how heavy and warm you feel.
          </h3>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink/75">
            That difference between tense and released — that&apos;s what relaxed
            actually feels like. Your body remembers it better each time.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={start}
              className="rounded-full bg-forest-800 px-7 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-forest-700"
            >
              Once more
            </button>
          </div>
        </div>
      ) : !running ? (
        <div className="text-center">
          <h3 className="font-display text-2xl font-medium text-forest-900 md:text-3xl">
            Tense, then let go.
          </h3>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink/70">
            We&apos;ll move through nine muscle groups, hands to feet. Tense each
            one for five seconds — about 70% effort, never to pain — then release
            for ten and just notice the difference.
          </p>
          <button
            onClick={start}
            className="mt-8 rounded-full bg-forest-800 px-8 py-3.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-700"
          >
            Begin — about 2½ minutes
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-forest-600">
            {group.name} · {groupIdx + 1} of {groups.length}
          </p>
          <h3 className="mt-3 min-h-[4.5rem] font-display text-2xl font-medium text-forest-900 md:text-3xl">
            {tensing ? group.tense : group.release}
          </h3>

          {/* a bar that fills while tensing and drains while releasing */}
          <div className="mx-auto mt-8 h-2 w-56 overflow-hidden rounded-full bg-forest-800/10">
            <motion.div
              key={`${groupIdx}-${phase}`}
              className={cn("h-full rounded-full", tensing ? "bg-forest-600" : "bg-gold")}
              initial={{ width: tensing ? "0%" : "100%" }}
              animate={{ width: tensing ? "100%" : "0%" }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { duration: tensing ? TENSE_SECS : RELEASE_SECS, ease: "linear" }
              }
            />
          </div>

          <p className="mt-4 text-sm tabular-nums text-ink/55">
            {tensing ? "hold the tension" : "and release…"} · {secondsLeft}s
          </p>

          <button onClick={stop} className="link-draw mt-7 text-sm text-ink/55">
            Stop
          </button>
        </div>
      )}

      <p className="mt-8 text-center text-xs leading-relaxed text-ink/45">
        Skip any group that hurts or feels wrong — this should never be painful.
      </p>
    </div>
  );
}
