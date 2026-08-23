"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { site } from "@/lib/site";

/**
 * A gentle, non-clinical 4-question check-in. It reflects back how you might be
 * doing and offers a kind next step — never a diagnosis.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

type Q = { q: string; options: { label: string; weight: number }[] };

const questions: Q[] = [
  {
    q: "How has your energy been this week?",
    options: [
      { label: "Running on empty", weight: 3 },
      { label: "Up and down", weight: 2 },
      { label: "Mostly okay", weight: 1 },
      { label: "Pretty good", weight: 0 },
    ],
  },
  {
    q: "And your sleep?",
    options: [
      { label: "Barely any", weight: 3 },
      { label: "Restless", weight: 2 },
      { label: "Okay-ish", weight: 1 },
      { label: "Restful", weight: 0 },
    ],
  },
  {
    q: "Your thoughts lately have been…",
    options: [
      { label: "Loud and racing", weight: 3 },
      { label: "Hard to quiet", weight: 2 },
      { label: "Manageable", weight: 1 },
      { label: "Calm enough", weight: 0 },
    ],
  },
  {
    q: "The idea of talking to someone feels…",
    options: [
      { label: "Honestly, overdue", weight: 3 },
      { label: "Maybe helpful", weight: 2 },
      { label: "Could be nice", weight: 1 },
      { label: "Not needed right now", weight: 0 },
    ],
  },
];

type Result = { title: string; body: string; primary: { label: string; href: string }; tone: string };

function resultFor(score: number): Result {
  if (score <= 3) {
    return {
      tone: "steady",
      title: "You sound mostly steady.",
      body: "That's genuinely good to hear. The best time to build a habit of checking in with yourself is when things are calm — a few minutes of breathing or journaling can keep it that way.",
      primary: { label: "Try a breathing exercise", href: "/breathe" },
    };
  }
  if (score <= 7) {
    return {
      tone: "some-weight",
      title: "You're carrying some weight.",
      body: "Nothing here is alarming, but a few things seem to be wearing on you. Talking it through with someone trained to listen can lighten the load before it grows. No pressure, no commitment — the first session is just a conversation.",
      primary: { label: "Find your therapist", href: "/match" },
    };
  }
  return {
    tone: "a-lot",
    title: "That sounds like a lot to hold.",
    body: "Thank you for being honest — that takes something. You don't have to carry this alone, and you don't have to wait until it's worse. Talking to a licensed psychologist can really help. If things ever feel unbearable, please reach out to Tele-MANAS at 14416, any time.",
    primary: { label: "Book a session", href: "/book" },
  };
}

export default function MoodCheckIn() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const total = questions.length;
  const done = step >= total;
  const score = answers.reduce((a, b) => a + b, 0);
  const result = done ? resultFor(score) : null;

  const choose = (weight: number) => {
    setAnswers((prev) => [...prev, weight]);
    setStep((s) => s + 1);
  };
  const restart = () => {
    setAnswers([]);
    setStep(0);
  };

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-forest-800/10 bg-ivory-light p-8 shadow-lift sm:p-10">
      {/* progress */}
      <div className="mb-8 flex items-center gap-2" aria-hidden="true">
        {questions.map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
              i < step ? "bg-gold" : "bg-forest-800/10"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-forest-600">
              Question {step + 1} of {total}
            </p>
            <h3 className="mt-3 font-display text-2xl font-medium text-forest-900 md:text-3xl">
              {questions[step].q}
            </h3>
            <div className="mt-7 grid gap-3">
              {questions[step].options.map((o) => (
                <button
                  key={o.label}
                  onClick={() => choose(o.weight)}
                  className="card-lift rounded-2xl border border-forest-800/10 bg-ivory px-5 py-4 text-left text-[0.98rem] text-forest-900 transition-colors hover:border-forest-600 hover:bg-sage-light/30"
                >
                  {o.label}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-forest-600">
              A gentle reflection
            </p>
            <h3 className="mt-3 font-display text-3xl font-medium text-forest-900">{result!.title}</h3>
            <p className="mt-4 leading-relaxed text-ink/75">{result!.body}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={result!.primary.href}
                className="rounded-full bg-gold px-7 py-3 text-sm font-semibold text-forest-950 transition-colors hover:bg-gold-dark"
              >
                {result!.primary.label}
              </Link>
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-forest-800/20 px-7 py-3 text-sm font-semibold text-forest-800 transition-colors hover:border-forest-800 hover:bg-forest-800 hover:text-ivory"
              >
                Talk it through
              </a>
              <button onClick={restart} className="link-draw text-sm text-ink/55">
                Start over
              </button>
            </div>
            <p className="mt-7 text-xs leading-relaxed text-ink/45">
              This check-in is a moment of reflection, not a diagnosis or medical advice.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
