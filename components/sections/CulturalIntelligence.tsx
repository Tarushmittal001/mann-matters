"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";

const EASE = [0.22, 1, 0.36, 1] as const;

/* The contexts Manu understands without needing the backstory explained.
   Pick a word, read the entry — a cultural phrasebook you flip through
   rather than a wall of cards. */
const contexts = [
  {
    deva: "परीक्षा",
    title: "The Marks Race",
    quote: "Kota se UPSC tak, sab pressure pata hai",
    body: "The coaching-center grind, rank-list nightmares, and parents who read report cards like horoscopes.",
    tags: ["Board Exams", "Coaching Centers", "Rank Anxiety"],
    icon: (
      <svg width="24" height="24" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d="M14 5 3 10l11 5 11-5-11-5Z" strokeLinejoin="round" />
        <path d="M7.5 12.5v5.2c0 1.6 2.9 2.9 6.5 2.9s6.5-1.3 6.5-2.9v-5.2" strokeLinecap="round" />
        <path d="M25 10v6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    deva: "परिवार",
    title: "Life in a Full House",
    quote: "Sab saath rehte hain, phir bhi koi sunta nahi",
    body: "In-law equations, privacy behind thin walls, and conversations that have to cross three generations.",
    tags: ["In-Laws", "Privacy", "Generation Gap"],
    icon: (
      <svg width="24" height="24" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d="m4.5 12.5 9.5-8 9.5 8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 11.5V23h14V11.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11.5 23v-5.5h5V23" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    deva: "रिश्ता",
    title: "The Rishta Season",
    quote: "Sahi umar nikli ja rahi hai, beta",
    body: "Biodata anxiety, compatibility doubts you can't raise at the dinner table, and the long shadow of family approval.",
    tags: ["Rishta Pressure", "Compatibility", "Family Approval"],
    icon: (
      <svg width="24" height="24" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d="M14 22.5S4.5 16.8 4.5 10.7A4.9 4.9 0 0 1 14 8.6a4.9 4.9 0 0 1 9.5 2.1c0 6.1-9.5 11.8-9.5 11.8Z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    deva: "लोग",
    title: "The Neighbourhood Jury",
    quote: "Char log kya kahenge?",
    body: "The aunty whisper network, reputation arithmetic, and the guilt that comes with choosing yourself.",
    tags: ["Social Stigma", "Reputation", "Cultural Guilt"],
    icon: (
      <svg width="24" height="24" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d="M4.5 6h14v9.5h-8L5.5 19l.2-3.5H4.5V6Z" strokeLinejoin="round" />
        <path d="M21.5 10.5h2V19h-1.2l.15 2.6-3.4-2.6H15" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    deva: "काम",
    title: "Hustle & Hierarchy",
    quote: "Boss ka message — ‘ek chhota sa call?’",
    body: "Burnout dressed up as ambition, feedback that only flows downward, and weekends that never quite arrive.",
    tags: ["Burnout", "Office Politics", "Work-Life Balance"],
    icon: (
      <svg width="24" height="24" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <rect x="4" y="9" width="20" height="13" rx="2" strokeLinejoin="round" />
        <path d="M10 9V6.8A2.3 2.3 0 0 1 12.3 4.5h3.4A2.3 2.3 0 0 1 18 6.8V9" strokeLinecap="round" />
        <path d="M4 15h20" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    deva: "उम्मीद",
    title: "Mummy-Papa Ke Sapne",
    quote: "Humne tumhare liye kya nahi kiya…",
    body: "Career crossroads, life choices under the family microscope, and the dread of disappointing the people who gave up everything.",
    tags: ["Career Choice", "Family Honor", "Parental Approval"],
    icon: (
      <svg width="24" height="24" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d="M14 6.5c-2.2-2-9.5-2.4-9.5-.5v15c0-1.9 7.3-1.5 9.5.5 2.2-2 9.5-2.4 9.5-.5V6c0-1.9-7.3-1.5-9.5.5Z" strokeLinejoin="round" />
        <path d="M14 6.5v15" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function CulturalIntelligence() {
  const [active, setActive] = useState(0);
  const c = contexts[active];

  return (
    <section className="section relative overflow-hidden bg-ivory-dark/50">
      <div className="wrap-wide">
        <SectionHeading
          align="center"
          deva="मन"
          eyebrow="culturally intelligent"
          title="Manu knows our Bharat"
          description="Generic apps ask for context. Manu was raised on it. Pick whichever one is sitting on your chest today."
        />

        {/* word chips — the phrasebook index */}
        <Reveal from="scale">
          <div
            className="-mx-5 flex snap-x gap-2.5 overflow-x-auto px-5 pb-3 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
            role="tablist"
            aria-label="Cultural contexts"
          >
            {contexts.map((ctx, i) => (
              <button
                key={ctx.title}
                role="tab"
                id={`ci-tab-${i}`}
                aria-selected={i === active}
                aria-controls="ci-panel"
                onClick={() => setActive(i)}
                className={`relative shrink-0 snap-start rounded-full border px-5 py-2.5 text-sm transition-colors duration-500 ease-silk ${
                  i === active
                    ? "border-forest-800 text-ivory"
                    : "border-sage/50 text-ink/70 hover:border-forest-800/40 hover:text-forest-800"
                }`}
              >
                {i === active && (
                  <motion.span
                    layoutId="ci-chip"
                    className="absolute inset-0 rounded-full bg-forest-800"
                    transition={{ duration: 0.5, ease: EASE }}
                  />
                )}
                <span className="relative flex items-center gap-2.5">
                  <span
                    className={`font-deva text-base ${i === active ? "text-gold" : "text-forest-700/60"}`}
                    aria-hidden="true"
                  >
                    {ctx.deva}
                  </span>
                  {ctx.title}
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        {/* the entry itself */}
        <Reveal delay={0.1}>
          <div className="relative mt-10 overflow-hidden rounded-3xl border border-sage/30 bg-ivory-light shadow-lift">
            {/* Devanagari watermark, re-keyed so it swells on change */}
            <AnimatePresence mode="wait">
              <motion.span
                key={`w-${active}`}
                className="pointer-events-none absolute -right-6 -top-10 select-none font-deva text-[9rem] leading-none text-forest-800/[0.06] md:text-[13rem]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.6, ease: EASE }}
                aria-hidden="true"
              >
                {c.deva}
              </motion.span>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                id="ci-panel"
                role="tabpanel"
                aria-labelledby={`ci-tab-${active}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="relative grid gap-8 p-8 md:grid-cols-[auto_minmax(0,1fr)] md:items-start md:gap-12 md:p-12"
              >
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-sage-light/60 text-forest-700 [&>svg]:h-8 [&>svg]:w-8">
                  {c.icon}
                </span>

                <div>
                  <p className="font-display text-2xl italic leading-snug text-forest-600 md:text-[2rem]">
                    &ldquo;{c.quote}&rdquo;
                  </p>
                  <p className="mt-5 max-w-2xl leading-relaxed text-ink/70">{c.body}</p>
                  <ul className="mt-7 flex flex-wrap gap-2" aria-label={`${c.title} topics`}>
                    {c.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-sage/40 bg-ivory px-3 py-1 text-[0.68rem] font-medium tracking-wide text-ink/60"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>

            <span className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-gold/0 via-gold to-gold/0" aria-hidden="true" />
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="mt-8 text-center text-ink/60">
            …and everything in between.{" "}
            <span className="font-display italic text-forest-700">
              You&rsquo;ll never have to explain why it&rsquo;s complicated.
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
