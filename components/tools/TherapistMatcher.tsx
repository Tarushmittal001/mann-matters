"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { type Expert } from "@/lib/experts";
import { budgetOpts, concernMap, findConcern, languageOpts, rank, type Concern } from "@/lib/matching";
import { formatINR } from "@/lib/utils";

/**
 * A three-step matcher: concern → language → budget. Scores every therapist and
 * surfaces the best fit, with a runner-up. Routes to booking.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-gold" aria-label={`${rating} out of 5`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z" />
      </svg>
      <span className="text-sm font-medium text-forest-800">{rating.toFixed(1)}</span>
    </span>
  );
}

function ExpertCard({ e, best }: { e: Expert; best?: boolean }) {
  return (
    <div
      className={`flex gap-4 rounded-2xl border bg-ivory p-5 ${
        best ? "border-gold/50 shadow-lift" : "border-forest-800/10"
      }`}
    >
      <Image
        src={e.photo}
        alt={e.name}
        width={72}
        height={72}
        className="h-18 w-18 shrink-0 rounded-xl object-cover"
        style={{ height: 72, width: 72 }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display text-lg font-medium text-forest-900">{e.name}</h4>
          <Stars rating={e.rating} />
        </div>
        <p className="mt-0.5 text-xs text-ink/55">{e.credentials}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {e.specialties.slice(0, 3).map((s) => (
            <span key={s} className="rounded-full bg-sage-light/50 px-2.5 py-0.5 text-[0.7rem] text-forest-700">
              {s}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-ink/60">
            {e.languages.join(" · ")} · <span className="font-semibold text-forest-800">{formatINR(e.price)}</span>
          </span>
          <Link href="/book" className="text-sm font-semibold text-gold-dark link-draw">
            Book →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TherapistMatcher({
  initialConcernId,
}: {
  /** Pre-answers step 1, for arrivals from the home-page concern picker. */
  initialConcernId?: string;
}) {
  const seeded = findConcern(initialConcernId);
  const [step, setStep] = useState(seeded ? 1 : 0);
  const [concern, setConcern] = useState<Concern | null>(seeded);
  const [language, setLanguage] = useState<string | null>(null);

  const reset = () => {
    setStep(0);
    setConcern(null);
    setLanguage(null);
  };

  const finish = (budgetTest: (p: number) => boolean) => {
    const ranked = rank(concern!.keys, language!, budgetTest);
    setResults(ranked.slice(0, 2));
    setStep(3);
  };
  const [results, setResults] = useState<Expert[]>([]);

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-forest-800/10 bg-ivory-light p-8 shadow-lift sm:p-10">
      <div className="mb-8 flex items-center gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
              i < step ? "bg-gold" : "bg-forest-800/10"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.4, ease: EASE }}>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-forest-600">Step 1 of 3</p>
            <h3 className="mt-3 font-display text-2xl font-medium text-forest-900 md:text-3xl">What&apos;s weighing on you most?</h3>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {concernMap.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setConcern(c); setStep(1); }}
                  className="card-lift rounded-2xl border border-forest-800/10 bg-ivory px-5 py-4 text-left text-[0.95rem] text-forest-900 transition-colors hover:border-forest-600 hover:bg-sage-light/30"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.4, ease: EASE }}>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-forest-600">Step 2 of 3</p>
            <h3 className="mt-3 font-display text-2xl font-medium text-forest-900 md:text-3xl">Which language feels most like home?</h3>
            {concern && (
              <p className="mt-3 text-sm text-ink/55">
                Looking for help with{" "}
                <span className="font-medium text-forest-800">{concern.label.toLowerCase()}</span>.{" "}
                <button onClick={reset} className="link-draw text-forest-700">
                  Change
                </button>
              </p>
            )}
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {languageOpts.map((l) => (
                <button
                  key={l}
                  onClick={() => { setLanguage(l); setStep(2); }}
                  className="card-lift rounded-2xl border border-forest-800/10 bg-ivory px-5 py-4 text-left text-[0.95rem] text-forest-900 transition-colors hover:border-forest-600 hover:bg-sage-light/30"
                >
                  {l}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.4, ease: EASE }}>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-forest-600">Step 3 of 3</p>
            <h3 className="mt-3 font-display text-2xl font-medium text-forest-900 md:text-3xl">What fits your budget?</h3>
            <div className="mt-7 grid gap-3">
              {budgetOpts.map((b) => (
                <button
                  key={b.label}
                  onClick={() => finish(b.test)}
                  className="card-lift rounded-2xl border border-forest-800/10 bg-ivory px-5 py-4 text-left text-[0.95rem] text-forest-900 transition-colors hover:border-forest-600 hover:bg-sage-light/30"
                >
                  {b.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-forest-600">Your best match</p>
            <h3 className="mt-3 font-display text-2xl font-medium text-forest-900">
              Based on your answers, start here.
            </h3>
            <div className="mt-6 space-y-4">
              {results.map((e, i) => (
                <ExpertCard key={e.id} e={e} best={i === 0} />
              ))}
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/services" className="text-sm font-semibold text-forest-700 link-draw">
                See all therapists →
              </Link>
              <button onClick={reset} className="link-draw text-sm text-ink/55">
                Start over
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
