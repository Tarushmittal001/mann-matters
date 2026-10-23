"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SelfCheck from "@/components/services/SelfCheck";
import { QUESTIONS, TOTAL_ITEMS } from "@/lib/assessment";
import type { Expert } from "@/lib/experts";
import { REGIONS } from "@/lib/palette";

/**
 * "Not sure?" on the home page — the self-check, started here, with no card.
 *
 * ── WHAT WAS WRONG ─────────────────────────────────────────────────────────
 * The question — the single most important thing in the section, the thing the
 * whole design exists to get someone to answer — was set at 1.25rem inside a
 * white box, beside a heading three times its size that said nothing. And
 * underneath the heading sat three stacked paragraphs of 14px grey print
 * explaining caveats before anyone had been asked anything.
 *
 * ── WHAT IT IS NOW ─────────────────────────────────────────────────────────
 * The question IS the headline. Nothing else competes with it. The four
 * answers are the real GAD-7 response set as before, but they are text on a
 * rule rather than four boxed buttons — the row of rules gives the tap target
 * without drawing a second container inside a container.
 *
 * The three paragraphs became one line. It still says, BEFORE the first tap,
 * that this is not a diagnosis, that nothing is stored, and that the result
 * needs an account — those are promises `app/privacy` makes and they are not
 * negotiable. They just do not need 60 words.
 *
 * Everything else is unchanged, and all of it matters:
 *
 * — The page asks the first question instead of advertising a test. A button
 *   saying "take the test" asks for a decision first: do I want to do a
 *   mental-health quiz right now? That is the whole barrier for the person
 *   this is written for. Tapping an option answers it and the dialog opens at
 *   question two with the answer already held.
 * — It is the REAL first item of GAD-7, not a teaser written to look like
 *   one. A fake warm-up question would either be thrown away or silently
 *   folded into a validated instrument, which would break the score.
 * — No result is shown here and none is implied: one item of a seven-item
 *   scale means nothing alone, and hinting otherwise would be handing out a
 *   diagnosis.
 * — Answers live in component state only. Nothing is written to storage,
 *   sent to the server, or logged.
 * — The account requirement is stated BEFORE the first question. Letting
 *   somebody answer nineteen questions about their mental health and only
 *   then asking them to register is a dark pattern, and `app/privacy`
 *   promises there are none.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const DOTS = [REGIONS.mint, REGIONS.teal, REGIONS.amber, REGIONS.rose];
const ink = (i: number) => (DOTS[i].id === "amber" ? "#A98943" : DOTS[i].hex);

export default function NotSure({ experts }: { experts: Expert[] }) {
  const [seed, setSeed] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | undefined>(undefined);
  const q = QUESTIONS[0];

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => alive && setSignedIn(Boolean(d.user)))
      .catch(() => alive && setSignedIn(false));
    return () => {
      alive = false;
    };
  }, []);

  const start = (value: number | null) => {
    setSeed(value);
    setOpen(true);
  };

  return (
    <section className="section bg-sage-light/30">
      <div className="wrap mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="eyebrow mb-7 flex items-center justify-center gap-3">
            <span
              className="font-deva text-sm normal-case tracking-normal text-gold"
              aria-hidden="true"
            >
              मन
            </span>
            not sure if you need this
          </p>

          <p className="mb-5 text-[0.95rem] text-ink/55">{q.scale.stem}</p>

          {/* the question, at the size the section's heading used to be */}
          <h2 className="h-display mx-auto max-w-3xl text-4xl md:text-5xl lg:text-[3.4rem]">
            {q.text}
          </h2>
        </motion.div>

        {/* four answers, on a rule. No boxes — the hairline and the generous
            padding give the tap target without a second container. */}
        <motion.div
          className="mx-auto mt-12 grid max-w-5xl border-t border-forest-800/15 sm:grid-cols-2 lg:grid-cols-4"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.6, delay: 0.12, ease: EASE }}
        >
          {q.scale.choices.map((choice, i) => (
            <button
              key={choice.label}
              type="button"
              onClick={() => start(choice.value)}
              className="group flex items-center justify-center gap-2.5 border-b border-forest-800/15 px-3 py-6 text-[1rem] lg:whitespace-nowrap text-forest-900 transition-colors duration-300 hover:bg-ivory-light/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:border-b-0 lg:border-r lg:last:border-r-0"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full transition-transform duration-300 group-hover:scale-[1.8]"
                style={{ background: ink(i) }}
                aria-hidden="true"
              />
              <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                {choice.label}
              </span>
            </button>
          ))}
        </motion.div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[0.85rem] text-ink/55">
          <span>Question 1 of {TOTAL_ITEMS} · about three minutes</span>
          <button
            type="button"
            onClick={() => start(null)}
            className="link-draw font-medium text-forest-700"
          >
            Or start from the beginning →
          </button>
        </div>

        {/*
          One line, said before the first tap rather than after the nineteenth.
          The account requirement is only hidden once we KNOW they are signed
          in — a notice that appears a second late has not done its job.
        */}
        <p className="mx-auto mt-5 max-w-2xl text-[0.85rem] leading-relaxed text-ink/45">
          A check, not a diagnosis. Nothing you tap is saved or sent anywhere
          {signedIn !== true && <> — you will need a free account to see your result</>}.
        </p>
      </div>

      <SelfCheck
        open={open}
        onClose={() => setOpen(false)}
        experts={experts}
        seed={seed}
        signedIn={signedIn}
      />
    </section>
  );
}
