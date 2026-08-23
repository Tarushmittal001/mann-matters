"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * The 5-4-3-2-1 grounding technique: name five things you can see, four you
 * can touch, three you can hear, two you can smell, one you can taste. Each
 * tap marks one noticed thing — slow, deliberate, back into the room.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

type Step = { count: number; sense: string; prompt: string; hint: string };

const steps: Step[] = [
  {
    count: 5,
    sense: "see",
    prompt: "Name five things you can see",
    hint: "the fan, a mug, the light on the wall — anything at all",
  },
  {
    count: 4,
    sense: "touch",
    prompt: "Notice four things you can feel",
    hint: "your feet on the floor, the fabric of your sleeve, the chair holding you",
  },
  {
    count: 3,
    sense: "hear",
    prompt: "Listen for three sounds around you",
    hint: "traffic far away, your own breath, the hum of something electric",
  },
  {
    count: 2,
    sense: "smell",
    prompt: "Find two things you can smell",
    hint: "chai going cold, fresh air from the window — or just the room itself",
  },
  {
    count: 1,
    sense: "taste",
    prompt: "Notice one thing you can taste",
    hint: "take a sip of water if you have some nearby",
  },
];

export default function GroundingExercise() {
  // step + found live in one state object so rapid taps can't race each other
  const [{ step, found }, setState] = useState({ step: 0, found: 0 });

  const done = step >= steps.length;
  const current = done ? null : steps[step];

  const markOne = () =>
    setState((s) => {
      const cur = steps[s.step];
      if (!cur) return s;
      if (s.found + 1 >= cur.count) return { step: s.step + 1, found: 0 };
      return { step: s.step, found: s.found + 1 };
    });

  const restart = () => setState({ step: 0, found: 0 });

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-forest-800/10 bg-ivory-light p-8 shadow-lift sm:p-10">
      {/* overall progress */}
      <div className="mb-8 flex items-center gap-2" aria-hidden="true">
        {steps.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-500",
              i < step ? "bg-gold" : "bg-forest-800/10"
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {!done && current ? (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="text-center"
          >
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-forest-600">
              {current.count} · {current.sense}
            </p>
            <h3 className="mt-3 font-display text-2xl font-medium text-forest-900 md:text-3xl">
              {current.prompt}
            </h3>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink/60">{current.hint}</p>

            {/* one dot per thing to notice */}
            <div className="mt-9 flex items-center justify-center gap-3" aria-hidden="true">
              {Array.from({ length: current.count }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-3.5 w-3.5 rounded-full transition-all duration-500 ease-silk",
                    i < found ? "scale-110 bg-gold" : "bg-forest-800/15"
                  )}
                />
              ))}
            </div>

            <button
              onClick={markOne}
              className="mt-9 rounded-full bg-forest-800 px-8 py-3.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-700"
            >
              Noticed one
            </button>
            <p className="mt-4 text-xs text-ink/45">
              Take your time — there&apos;s no clock on this.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-center"
          >
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-forest-600">
              Back in the room
            </p>
            <h3 className="mt-3 font-display text-3xl font-medium text-forest-900">
              You&apos;re here. That&apos;s the whole trick.
            </h3>
            <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink/75">
              Anxiety lives in the past and the future — your senses only live in
              the present. Come back to this whenever the spiral starts.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/breathe"
                className="rounded-full bg-gold px-7 py-3 text-sm font-semibold text-forest-950 transition-colors hover:bg-gold-dark"
              >
                Slow your breath next
              </Link>
              <button onClick={restart} className="link-draw text-sm text-ink/55">
                Go through it again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
