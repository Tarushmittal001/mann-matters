"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CrisisLine } from "@/components/ui/Feedback";
import { useStepFocus } from "@/components/ui/useStepFocus";

/**
 * A burnout reflection, in three parts: exhaustion, distance from the work, and
 * whether you still feel any good at it.
 *
 * Those are the three dimensions the research describes, but the wording here
 * is ours — the standard questionnaires are licensed instruments that cost per
 * use, and copying them would be both illegal and dishonest. So this is not a
 * score anyone can put in a file. It is a mirror, and it says so.
 *
 * Nothing is stored or sent.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

type Dimension = "exhaustion" | "distance" | "efficacy";

type Item = { text: string; dim: Dimension; reverse?: boolean };

const ITEMS: Item[] = [
  { text: "I wake up already tired, even after a full night.", dim: "exhaustion" },
  { text: "By the middle of the week I have nothing left for anything outside work.", dim: "exhaustion" },
  { text: "Small tasks take far more out of me than they used to.", dim: "exhaustion" },
  { text: "I feel numb about work that used to matter to me.", dim: "distance" },
  { text: "I have become more cynical about the place, or the people in it.", dim: "distance" },
  { text: "I do the minimum and count the hours.", dim: "distance" },
  { text: "I still feel I do this work well.", dim: "efficacy", reverse: true },
  { text: "I finish most days able to point to something I did.", dim: "efficacy", reverse: true },
  { text: "I doubt whether any of it makes a difference.", dim: "efficacy" },
  { text: "Sunday evening has a dread to it.", dim: "distance" },
  { text: "My body has been telling me something: sleep, stomach, headaches, illness that lingers.", dim: "exhaustion" },
  { text: "I snap at people who did not deserve it.", dim: "exhaustion" },
];

const CHOICES = ["Never", "Rarely", "Sometimes", "Often", "Always"];

const LABELS: Record<Dimension, { title: string; blurb: string }> = {
  exhaustion: {
    title: "Running on empty",
    blurb: "How depleted you are, in body as much as mind.",
  },
  distance: {
    title: "Distance from the work",
    blurb: "The cynicism and switching-off that arrive to protect you.",
  },
  efficacy: {
    title: "Whether it feels worth it",
    blurb: "Your sense of being any good at it, and of it mattering.",
  },
};

export default function BurnoutCheck() {
  const reduced = useReducedMotion();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [done, setDone] = useState(false);
  // the result replaces the questions; its heading takes focus so it is announced
  const resultRef = useStepFocus(done);

  const answered = Object.keys(answers).length;
  const complete = answered === ITEMS.length;

  const scores = () => {
    const by: Record<Dimension, number[]> = { exhaustion: [], distance: [], efficacy: [] };
    ITEMS.forEach((item, i) => {
      const raw = answers[i] ?? 0;
      by[item.dim].push(item.reverse ? 4 - raw : raw);
    });
    const pct = (list: number[]) => Math.round((list.reduce((a, b) => a + b, 0) / (list.length * 4)) * 100);
    return {
      exhaustion: pct(by.exhaustion),
      distance: pct(by.distance),
      efficacy: pct(by.efficacy),
      overall: pct([...by.exhaustion, ...by.distance, ...by.efficacy]),
    };
  };

  if (done) {
    const s = scores();
    const band =
      s.overall >= 65
        ? {
            head: "This reads like burnout, not a bad week.",
            body: "Three or four weeks of this, with the body joining in, is the point where rest alone stops fixing it. What helps is changing something structural — hours, scope, or the job — and having someone to think it through with.",
          }
        : s.overall >= 40
          ? {
              head: "You're running hot.",
              body: "Not burnt out, but heading that way. At this stage small changes still work: protecting one evening, putting one thing down, saying no to the next thing before it arrives.",
            }
          : {
              head: "You're tired, not burnt out.",
              body: "The usual repairs — sleep, a proper break, a weekend that isn't admin — should still land. Worth checking again if this month is unusually heavy.",
            };

    return (
      <motion.div
        className="mx-auto w-full max-w-2xl"
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div className="rounded-3xl border border-forest-800/10 bg-ivory-light p-7 shadow-lift sm:p-9">
          <p className="eyebrow mb-4">what you told us</p>
          <h2 ref={resultRef} tabIndex={-1} className="step-focus font-display text-[1.7rem] font-medium leading-snug text-forest-900">{band.head}</h2>
          <p className="mt-3 leading-relaxed text-ink/70">{band.body}</p>
          {/* burnout is not a crisis, but someone scoring this high may be close to one */}
          {s.overall >= 65 && (
            <div className="mt-6 rounded-2xl border border-forest-800/15 bg-sage-light/50 p-4">
              <CrisisLine lead="If it has started to feel like more than work, you can talk to someone today — free, any time." />
            </div>
          )}

          <div className="mt-8 space-y-5 border-t border-forest-800/10 pt-7">
            {(Object.keys(LABELS) as Dimension[]).map((dim) => (
              <div key={dim}>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-display text-lg font-medium text-forest-900">{LABELS[dim].title}</p>
                  <span className="font-display text-lg text-forest-800">{s[dim]}%</span>
                </div>
                <p className="mt-0.5 text-[0.85rem] text-ink/70">{LABELS[dim].blurb}</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-forest-800/10">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      s[dim] >= 65 ? "bg-[#C56A72]" : s[dim] >= 40 ? "bg-gold" : "bg-[#5FA98A]"
                    )}
                    initial={reduced ? false : { width: 0 }}
                    animate={{ width: `${s[dim]}%` }}
                    transition={{ duration: 0.8, ease: EASE }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-forest-800/10 pt-6">
            <a
              href="/book"
              className="press rounded-full bg-gold px-6 py-3 text-[0.95rem] font-semibold text-forest-950 transition-colors hover:bg-gold-dark"
            >
              Talk it through with someone
            </a>
            <button
              type="button"
              onClick={() => {
                setAnswers({});
                setDone(false);
              }}
              className="link-draw text-sm font-medium text-forest-800"
            >
              Start again
            </button>
          </div>
        </div>

        <p className="mt-6 text-[0.8rem] leading-relaxed text-ink/70">
          This is a reflection, not a diagnosis, and burnout is not a medical diagnosis in itself.
          Exhaustion this heavy can also come from depression, anaemia, thyroid trouble or sleep
          apnoea — all worth ruling out with a doctor. Nothing here was stored or sent.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-forest-800/10">
          <motion.div
            className="h-full rounded-full bg-gold"
            animate={{ width: `${(answered / ITEMS.length) * 100}%` }}
            transition={{ duration: 0.35, ease: EASE }}
          />
        </div>
        <span className="font-display text-sm tabular-nums text-ink/70">
          {answered}/{ITEMS.length}
        </span>
      </div>

      <p className="mb-5 text-[0.9rem] text-ink/70">
        Thinking about the last month at work — or at study, or at home if that is your work.
      </p>

      <div className="space-y-3">
        {ITEMS.map((item, i) => (
          <div key={item.text} className="rounded-2xl border border-forest-800/10 bg-ivory-light p-5">
            <p className="text-[1rem] leading-snug text-forest-900">{item.text}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {CHOICES.map((choice, value) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => setAnswers((a) => ({ ...a, [i]: value }))}
                  aria-pressed={answers[i] === value}
                  className={cn(
                    "press rounded-full border px-3.5 py-1.5 text-[0.82rem] font-medium transition-colors",
                    answers[i] === value
                      ? "border-forest-800 bg-forest-800 text-ivory"
                      : "border-forest-800/15 text-ink/70 hover:border-forest-800/40"
                  )}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {complete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-7"
          >
            <button
              type="button"
              onClick={() => setDone(true)}
              className="press w-full rounded-full bg-gold px-7 py-4 text-[1rem] font-semibold text-forest-950 transition-colors hover:bg-gold-dark"
            >
              See what it says
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
