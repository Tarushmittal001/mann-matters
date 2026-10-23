"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/ui/Reveal";
import SelfCheck from "@/components/services/SelfCheck";
import { QUESTIONS, TOTAL_ITEMS } from "@/lib/assessment";
import type { Expert } from "@/lib/experts";
import { REGIONS } from "@/lib/palette";

/**
 * "Not sure?" on the home page — the self-check, started here.
 *
 * ── WHY THE QUESTION IS ON THE PAGE ────────────────────────────────────────
 * A button saying "take the test" asks for a decision first: do I want to do a
 * mental-health quiz right now? That is the whole barrier for the person this
 * is written for, who is not sure anything is wrong enough to count. So the
 * page asks the first question instead of advertising it. Tapping an option
 * answers it, and the dialog opens at question two with the answer already
 * held. You are in before you decided to start, and you can close it at any
 * point with nothing kept.
 *
 * It is the REAL first item of GAD-7, not a teaser written to look like one.
 * A fake warm-up question would either be thrown away (wasting the tap) or
 * silently folded into a validated instrument, which would break the score.
 *
 * ── WHAT IT MUST NOT DO ────────────────────────────────────────────────────
 * No result is shown here and none is implied: one item of a seven-item scale
 * means nothing on its own, and a page that hinted otherwise would be handing
 * out a diagnosis. The copy says screener, not diagnosis, before the question
 * rather than after it.
 *
 * Answers live in component state only. Nothing is written to storage, sent to
 * the server, or logged — the same rule the dialog itself works under.
 *
 * ── THE RESULT NEEDS AN ACCOUNT, AND WE SAY SO FIRST ──────────────────────
 * The line about signing in sits above the question, not after the nineteenth
 * one. Letting somebody answer nineteen questions about their mental health
 * and only then asking them to register is a dark pattern, and the privacy
 * page promises there are none. Nothing is saved across a sign-in either —
 * storing those answers is exactly what PRODUCT.md forbids — so the honest
 * thing is to let them decide before they spend the three minutes.
 */
export default function NotSure({ experts }: { experts: Expert[] }) {
  const [seed, setSeed] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  /** undefined until /api/auth/me answers, so nothing flashes the wrong way. */
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
    <section className="section bg-sage-light/25">
      <div className="wrap-wide grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <Reveal>
          <p className="eyebrow mb-4 flex items-center gap-3">
            <span
              className="font-deva text-sm normal-case tracking-normal text-gold"
              aria-hidden="true"
            >
              मन
            </span>
            not sure if you need this
          </p>
          <h2 className="h-display text-3xl md:text-4xl">
            Most people are not sure.{" "}
            <span className="italic text-forest-600">Start here.</span>
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-ink/70">
            {TOTAL_ITEMS} short questions, about three minutes. They are the same
            questions a psychologist would ask, and at the end you get one
            suggested place to start.
          </p>
          <p className="mt-4 max-w-md text-[0.88rem] leading-relaxed text-ink/70">
            This is a check, not a diagnosis. Nothing you tap is saved or sent
            anywhere.
          </p>
          {/*
            Said before the first question, on purpose. See the note above.
            Shown by default and hidden only once we know they are signed in:
            an honesty notice that appears a second late, after someone has
            already tapped an answer, has not done its job.
          */}
          {signedIn !== true && (
            <p className="mt-3 max-w-md text-[0.88rem] leading-relaxed text-ink/70">
              You will need a free account to see your result at the end.
            </p>
          )}
        </Reveal>

        <Reveal delay={0.1}>
          {/*
            The card is the first question, live. The options are the real
            GAD-7 response set, so a tap here is a real answer.
          */}
          <div className="rounded-2xl border border-forest-800/15 bg-ivory-light p-6 shadow-lift sm:p-8">
            <p className="text-[0.75rem] uppercase tracking-[0.14em] text-ink/70">
              Question 1 of {TOTAL_ITEMS}
            </p>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink/70">
              {q.scale.stem}
            </p>
            <p className="mt-2 font-display text-xl font-medium leading-snug text-forest-900 sm:text-2xl">
              {q.text}
            </p>

            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {q.scale.choices.map((choice, i) => (
                <button
                  key={choice.label}
                  type="button"
                  onClick={() => start(choice.value)}
                  className="group flex items-center gap-3 rounded-xl border border-forest-800/15 bg-ivory px-4 py-3 text-left text-[0.92rem] text-forest-900 transition-colors duration-200 hover:border-forest-800/40 hover:bg-sage-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-800"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-150"
                    style={{
                      background: [
                        REGIONS.mint,
                        REGIONS.teal,
                        REGIONS.amber,
                        REGIONS.rose,
                      ][i].hex,
                    }}
                    aria-hidden="true"
                  />
                  {choice.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => start(null)}
              className="link-draw mt-5 text-[0.88rem] font-medium text-forest-700"
            >
              Or take the whole check from the start →
            </button>
          </div>
        </Reveal>
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
