"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Portal from "@/components/ui/Portal";
import type { Expert } from "@/lib/experts";
import Button from "@/components/ui/Button";
import {
  CONTEXTS,
  QUESTIONS,
  SCALES,
  recommend,
  type ScaleId,
} from "@/lib/assessment";
import { regionFor, regionForScale } from "@/lib/palette";
import { site } from "@/lib/site";
import { formatINR, cn } from "@/lib/utils";

/**
 * The self-check: nineteen validated screener items asked one at a time, and a
 * result that leads with the therapists rather than the paperwork.
 *
 * The instrument, the scoring and the routing all live in lib/assessment.ts —
 * this file is only the room they happen in.
 *
 * One question per screen, auto-advancing on answer. A page of eight items at
 * once is a form; a single question is a conversation, and this is the sort of
 * thing people fill in at midnight on a phone.
 *
 * The result puts **who you would see** first. The percentages and the service
 * matter, but nobody books a number — they book a person, and burying the
 * therapists under two blocks of scoring made the useful part the least visible
 * thing on the screen.
 *
 * **Nothing here is submitted or stored.** Answers live in component state for
 * as long as the dialog is open and are gone when it closes: no localStorage,
 * no request, no analytics event. This is health data about an identifiable
 * person, and the promise the rest of the site makes about sessions has to hold
 * for a questionnaire too.
 *
 * The crisis line is on the result at every score, and moves to the top when
 * the answers are high.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fallback for the progress bar on the steps that belong to no screener. */
const REGION_GOLD = "#C8A45D";

/** Steps: 0 intro · 1..N questions · N+1 context · N+2 result. */
const CONTEXT_STEP = QUESTIONS.length + 1;
const RESULT_STEP = QUESTIONS.length + 2;

/** "Dr. Kabir Shah" -> "Kabir". A button reading "Book with Dr." is not a name. */
function firstName(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  return parts[0].endsWith(".") && parts.length > 1 ? parts[1] : parts[0];
}

const emptyAnswers = (): Record<ScaleId, (number | null)[]> => ({
  anxiety: Array(SCALES[0].items.length).fill(null),
  mood: Array(SCALES[1].items.length).fill(null),
  stress: Array(SCALES[2].items.length).fill(null),
});

export default function SelfCheck({
  open,
  onClose,
  experts,
}: {
  open: boolean;
  onClose: () => void;
  experts: Expert[];
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const advanceRef = useRef<number | null>(null);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<ScaleId, (number | null)[]>>(emptyAnswers);
  const [context, setContext] = useState<string | null>(null);

  // remember the opener, lock the page, restore focus on close
  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    }, 60);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      openerRef.current?.focus?.();
    };
  }, [open]);

  // start clean every time — nobody's answers should outlive the dialog
  useEffect(() => {
    if (open) return;
    const t = window.setTimeout(() => {
      setStep(0);
      setContext(null);
      setAnswers(emptyAnswers());
    }, 250);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => () => {
    if (advanceRef.current) window.clearTimeout(advanceRef.current);
  }, []);

  // Escape closes; Tab is trapped inside the panel
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const question = step >= 1 && step <= QUESTIONS.length ? QUESTIONS[step - 1] : null;
  const current = question ? answers[question.scale.id][question.index] : null;

  const answered = useMemo(
    () => Object.values(answers).flat().filter((v) => v !== null).length,
    [answers]
  );

  const result = useMemo(
    () => (step === RESULT_STEP ? recommend(answers, context, experts) : null),
    [step, answers, context]
  );

  /** Record an answer and move on, with a beat so the choice is visibly taken. */
  const answer = (value: number) => {
    if (!question) return;
    setAnswers((prev) => {
      const next = [...prev[question.scale.id]];
      next[question.index] = value;
      return { ...prev, [question.scale.id]: next };
    });
    if (advanceRef.current) window.clearTimeout(advanceRef.current);
    advanceRef.current = window.setTimeout(() => setStep((s) => s + 1), 220);
  };

  const progress =
    step === 0 ? 0 : step > CONTEXT_STEP ? 100 : ((step - 1) / QUESTIONS.length) * 100;

  return (
    <Portal>
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-forest-950/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-ivory-light shadow-bloom sm:rounded-3xl"
          >
            {/* ── head ─────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-6 border-b border-forest-800/10 px-7 py-5 md:px-9">
              <div>
                <p className="eyebrow flex items-center gap-2.5 text-[0.68rem]">
                  <span className="font-deva normal-case tracking-normal text-gold" aria-hidden="true">
                    मन
                  </span>
                  {question ? question.scale.source : "the self-check"}
                </p>
                <h2 id={titleId} className="mt-2 font-display text-xl font-medium text-forest-900">
                  {step === RESULT_STEP
                    ? "Who we would put you with"
                    : question
                      ? question.scale.title
                      : step === CONTEXT_STEP
                        ? "One last thing"
                        : "Which of these do you need?"}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 shrink-0 rounded-full p-2 text-ink/45 transition-colors hover:bg-forest-800/[0.06] hover:text-forest-900"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {step >= 1 && step <= CONTEXT_STEP && (
              <div className="h-[3px] w-full bg-forest-800/10" aria-hidden="true">
                <div
                  className="h-full transition duration-500 ease-silk"
                  style={{
                    width: `${progress}%`,
                    // the bar wears the colour of the screener being answered
                    background: question ? regionForScale(question.scale.id).hex : REGION_GOLD,
                  }}
                />
              </div>
            )}

            {/* ── body ─────────────────────────────────────────────── */}
            <div ref={bodyRef} className="flex-1 overflow-y-auto overscroll-contain px-7 py-8 md:px-9 md:py-10">
              {/* intro */}
              {step === 0 && (
                <div>
                  <p className="text-[0.97rem] leading-relaxed text-ink/75">
                    Nineteen questions, one at a time, about three minutes. They are
                    the same three screeners a psychologist would use — the GAD-7,
                    the PHQ-8 and the PSS-4 — so the result is worth repeating in a
                    session rather than a number we invented.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {[
                      "At the end: two therapists who work on what you describe, and one service out of ten to start with.",
                      "Nothing is sent anywhere. Your answers stay in this window and are gone when you close it.",
                      "This is a screener, not a diagnosis. Only a clinician can give you one of those.",
                    ].map((line) => (
                      <li key={line} className="flex gap-3 text-[0.92rem] leading-relaxed text-ink/70">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* one question, alone on the screen */}
              {question && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={question.n}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.28, ease: EASE }}
                    className="flex min-h-[16rem] flex-col justify-center"
                  >
                    <p className="text-[0.8rem] italic leading-relaxed text-forest-600">
                      {question.scale.stem}
                    </p>
                    <fieldset className="mt-4">
                      <legend className="font-display text-[1.55rem] font-medium leading-snug text-forest-900 md:text-[1.8rem]">
                        {question.text}
                      </legend>
                      <div className="mt-8 flex flex-col gap-2.5">
                        {question.scale.choices.map((choice) => {
                          const active = current === choice.value;
                          return (
                            <button
                              key={choice.label}
                              type="button"
                              aria-pressed={active}
                              onClick={() => answer(choice.value)}
                              className={cn(
                                "flex w-full items-center gap-3.5 rounded-xl border px-5 py-3.5 text-left text-[0.95rem] font-medium transition duration-300 ease-silk",
                                active
                                  ? "border-forest-800 bg-forest-800 text-ivory"
                                  : "border-forest-800/15 text-ink/80 hover:border-forest-800/45 hover:bg-forest-800/[0.03]"
                              )}
                            >
                              <span
                                className={cn(
                                  "grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors duration-300",
                                  active ? "border-transparent" : "border-forest-800/30"
                                )}
                                style={active ? { background: regionForScale(question.scale.id).hex } : undefined}
                                aria-hidden="true"
                              >
                                {active && <span className="h-1.5 w-1.5 rounded-full bg-forest-900" />}
                              </span>
                              {choice.label}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  </motion.div>
                </AnimatePresence>
              )}

              {/* what it is about */}
              {step === CONTEXT_STEP && (
                <div>
                  <p className="text-[0.8rem] italic leading-relaxed text-forest-600">
                    The scores say how heavy it is. This says which door to walk through.
                  </p>
                  <h3 className="mt-4 font-display text-[1.55rem] font-medium leading-snug text-forest-900 md:text-[1.8rem]">
                    And what is most of it about?
                  </h3>
                  <div className="mt-7 space-y-2.5">
                    {CONTEXTS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        aria-pressed={context === c.id}
                        onClick={() => {
                          setContext(c.id);
                          if (advanceRef.current) window.clearTimeout(advanceRef.current);
                          advanceRef.current = window.setTimeout(() => setStep(RESULT_STEP), 240);
                        }}
                        className={cn(
                          "block w-full rounded-xl border px-5 py-3.5 text-left text-[0.93rem] leading-snug transition duration-300 ease-silk",
                          context === c.id
                            ? "border-forest-800 bg-forest-800 text-ivory"
                            : "border-forest-800/15 text-ink/75 hover:border-forest-800/40 hover:bg-forest-800/[0.03]"
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── the result: people first ─────────────────────── */}
              {step === RESULT_STEP && result && (
                <div>
                  {result.clinical && (
                    <div className="mb-8 rounded-xl border-l-2 border-gold bg-ivory-dark/70 px-5 py-4">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold-dark">
                        please read this first
                      </p>
                      <p className="mt-2 text-[0.92rem] leading-relaxed text-ink/75">
                        Your answers are in the range where speaking to someone soon
                        matters more than choosing the perfect format. If things feel
                        unsafe at any point, call{" "}
                        <strong className="font-semibold text-forest-900">Tele-MANAS 14416</strong>{" "}
                        — free, 24x7, in 20+ languages — or 112 in an emergency.
                      </p>
                    </div>
                  )}

                  {/* the therapists, as the main event */}
                  <p className="text-[0.93rem] leading-relaxed text-ink/70">
                    Based on what you described, these two work on exactly this. Booking
                    asks you to sign in first — so what you share is attached to an
                    account you control.
                  </p>

                  <div className="mt-6 space-y-4">
                    {result.experts.map((e) => (
                      <div
                        key={e.id}
                        className="flex flex-col gap-5 rounded-2xl border border-forest-800/12 bg-ivory p-5 sm:flex-row sm:items-center"
                      >
                        <Image
                          src={e.photo}
                          alt=""
                          width={160}
                          height={160}
                          className="h-20 w-20 shrink-0 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-[1.25rem] font-medium leading-snug text-forest-900">
                            {e.name}
                          </p>
                          <p className="mt-0.5 text-[0.78rem] leading-snug text-ink/55">
                            {e.credentials} · {e.experience}
                          </p>
                          <p className="mt-2 text-[0.85rem] leading-snug text-ink/70">
                            {e.specialties.slice(0, 3).join(" · ")}
                          </p>
                          <p className="mt-1.5 text-[0.8rem] text-ink/55">
                            {e.languages.join(", ")} · {formatINR(e.price)} per session
                          </p>
                        </div>
                        <Button href={`/book?expert=${e.id}`} variant="gold" className="shrink-0">
                          Book with {firstName(e.name)}
                        </Button>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-[0.85rem] text-ink/55">
                    Prefer to choose yourself?{" "}
                    <Link href="/match" className="link-draw font-medium text-forest-800">
                      See every therapist
                    </Link>
                    .
                  </p>

                  {/* then the format */}
                  <div
                    className="mt-9 rounded-2xl border border-forest-800/12 bg-ivory-dark/40 p-6 border-l-[3px]"
                    style={{ borderLeftColor: regionFor(result.service.slug).hex }}
                  >
                    <p
                      className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: regionFor(result.service.slug).hex }}
                    >
                      the format we would start with
                    </p>
                    <h3 className="mt-2.5 font-display text-xl font-medium text-forest-900">
                      {result.service.title}
                    </h3>
                    <p className="mt-2.5 text-[0.92rem] leading-relaxed text-ink/70">{result.because}</p>
                    <p className="mt-3 text-[0.85rem] text-ink/55">
                      {result.service.duration}
                      {result.service.price
                        ? ` · ${formatINR(result.service.price)} ${result.service.priceNote}`
                        : ` · ${result.service.priceNote}`}
                      {" · "}
                      <Link
                        href={`/services/${result.service.slug}`}
                        className="link-draw font-medium text-forest-800"
                      >
                        read the detail
                      </Link>
                    </p>
                    {result.alternative && (
                      <p className="mt-3 text-[0.85rem] leading-relaxed text-ink/60">
                        {result.clinical ? "And alongside it:" : "A lighter way in:"}{" "}
                        <Link
                          href={`/services/${result.alternative.slug}`}
                          className="link-draw font-medium text-forest-800"
                        >
                          {result.alternative.title}
                        </Link>
                        .
                      </p>
                    )}
                  </div>

                  {/* and finally the numbers */}
                  <div className="mt-8">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold-dark">
                      what you scored
                    </p>
                    <div className="mt-4 space-y-4">
                      {result.results.map((r) => (
                        <div key={r.scale.id}>
                          <div className="flex items-baseline justify-between gap-4">
                            <p className="font-display text-[1.05rem] font-medium text-forest-900">
                              {r.scale.title}
                              <span
                                className="ml-2.5 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.14em]"
                                style={{ color: regionForScale(r.scale.id).hex }}
                              >
                                {r.band.label}
                              </span>
                            </p>
                            <p className="font-display text-[1.05rem] tabular-nums text-forest-900">
                              {r.percent}%
                              <span className="ml-1.5 font-sans text-[0.72rem] font-normal text-ink/45">
                                {r.score}/{r.max}
                              </span>
                            </p>
                          </div>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-forest-800/10">
                            <div
                              className="h-full rounded-full transition duration-700 ease-silk"
                              style={{ width: `${r.percent}%`, background: regionForScale(r.scale.id).hex }}
                            />
                          </div>
                          <p className="mt-1.5 text-[0.82rem] leading-relaxed text-ink/60">{r.band.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="mt-8 border-t border-forest-800/10 pt-5 text-[0.82rem] leading-relaxed text-ink/55">
                    This is a screener, not a diagnosis — only a licensed clinician can
                    give you one of those, and these numbers are a starting point for
                    that conversation rather than a substitute for it. If you are in
                    crisis, call Tele-MANAS{" "}
                    <strong className="font-semibold text-forest-900">14416</strong> or {site.phone}.
                  </p>
                </div>
              )}
            </div>

            {/* ── foot ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-4 border-t border-forest-800/10 bg-ivory px-7 py-4 md:px-9">
              {step === 0 ? (
                <>
                  <p className="text-[0.8rem] text-ink/50">Nineteen questions · about three minutes</p>
                  <Button onClick={() => setStep(1)} variant="gold">
                    Begin
                  </Button>
                </>
              ) : step === RESULT_STEP ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setAnswers(emptyAnswers());
                      setContext(null);
                      setStep(1);
                    }}
                    className="text-[0.85rem] font-medium text-ink/55 transition-colors hover:text-forest-800"
                  >
                    Start again
                  </button>
                  <Button onClick={onClose} variant="outline">
                    Close
                  </Button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    className="text-[0.85rem] font-medium text-ink/55 transition-colors hover:text-forest-800"
                  >
                    Back
                  </button>
                  <p className="text-[0.8rem] tabular-nums text-ink/45">
                    {step === CONTEXT_STEP
                      ? `${answered} of ${QUESTIONS.length} answered`
                      : `${step} of ${QUESTIONS.length}`}
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </Portal>
  );
}
