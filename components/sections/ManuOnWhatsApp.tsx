"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Reveal from "@/components/ui/Reveal";
import TryManuDemo from "@/components/TryManu/TryManuDemo";
import { site } from "@/lib/site";

const EASE = [0.22, 1, 0.36, 1] as const;

/* Three faces of the same companion. Kept to one line each — the chat
   beside it is doing the real explaining. */
const tabs = [
  {
    id: "everyday",
    label: "Everyday",
    items: [
      {
        title: "Talks how you talk",
        body: "Hinglish, Hindi or English — switch mid-sentence and Manu keeps up, slang and all.",
      },
      {
        title: "Anonymous, if you want",
        body: "Say the word and nothing is stored. No name, no number, no one ever knows it was you.",
      },
      {
        title: "Mood, tracked gently",
        body: "One “Mood aaj?” a day. Over weeks it draws your pattern back to you — the dips and the climbs.",
      },
    ],
  },
  {
    id: "habit",
    label: "Staying with it",
    items: [
      {
        title: "Daily check-ins",
        body: "Three quick questions and a tip tuned to your answer, nudged to you on WhatsApp.",
      },
      {
        title: "Streaks & badges",
        body: "Seven days running earns Bronze. Proof, in your own chat, that you showed up for yourself.",
      },
      {
        title: "Weekly challenges",
        body: "Small quests — “share 3 wins” — that unlock peer chats and build a habit that sticks.",
      },
    ],
  },
  {
    id: "safety",
    label: "Safety net",
    items: [
      {
        title: "CBT & DBT tools in your pocket",
        body: "Grounding, reframing, gratitude journaling — walked through one tap at a time.",
      },
      {
        title: "A real psychologist, when it matters",
        body: "At any sign of self-harm Manu stops being the hero and hands you to an RCI-licensed human.",
      },
    ],
  },
] as const;

export default function ManuOnWhatsApp() {
  const [active, setActive] = useState(0);
  const tab = tabs[active];

  return (
    <section className="section bg-forest-950 text-ivory">
      <div className="wrap-wide">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] lg:gap-20">
          {/* Left — the live demo does the talking */}
          <Reveal from="left" className="min-w-0">
            <TryManuDemo embedded />
          </Reveal>

          {/* Right — heading + switchable proof */}
          <div className="min-w-0 lg:pt-4">
            <Reveal from="right">
              <p className="eyebrow mb-4 flex items-center gap-3 text-sage">
                <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">
                  मन
                </span>
                on whatsapp, 24x7
              </p>
              <h2 className="h-display text-4xl !text-ivory md:text-5xl">
                Meet Manu — your <em className="italic text-sage">4 a.m. dost</em>
              </h2>
              <p className="mt-5 max-w-lg leading-relaxed text-sage-light/75">
                No new app, no waiting room. Try the chat on the left — it&apos;s the
                real thing, right here on the page.
              </p>
            </Reveal>

            {/* Tabs */}
            <Reveal from="right" delay={0.1}>
              <div className="mt-10 flex gap-1" role="tablist" aria-label="What Manu does">
                {tabs.map((t, i) => (
                  <button
                    key={t.id}
                    role="tab"
                    id={`manu-tab-${t.id}`}
                    aria-selected={i === active}
                    aria-controls={`manu-panel-${t.id}`}
                    onClick={() => setActive(i)}
                    className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                      i === active ? "text-ivory" : "text-sage-light/50 hover:text-sage-light/80"
                    }`}
                  >
                    {t.label}
                    {i === active && (
                      <motion.span
                        layoutId="manu-tab-underline"
                        className="absolute inset-x-2 -bottom-px h-px bg-gold"
                        transition={{ duration: 0.45, ease: EASE }}
                      />
                    )}
                  </button>
                ))}
              </div>
              <div className="h-px w-full bg-white/10" aria-hidden="true" />
            </Reveal>

            {/* Panel */}
            <div className="relative mt-7 min-h-[16rem]">
              <AnimatePresence mode="wait">
                <motion.ul
                  key={tab.id}
                  role="tabpanel"
                  id={`manu-panel-${tab.id}`}
                  aria-labelledby={`manu-tab-${tab.id}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="space-y-6"
                >
                  {tab.items.map((item) => (
                    <li key={item.title} className="flex gap-5">
                      <span className="gold-rule mt-3.5 shrink-0" aria-hidden="true" />
                      <div>
                        <h3 className="font-display text-lg font-medium text-ivory">{item.title}</h3>
                        <p className="mt-1.5 max-w-lg text-[0.95rem] leading-relaxed text-sage-light/75">
                          {item.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </motion.ul>
              </AnimatePresence>
            </div>

            {/* Crisis note + CTA, folded into one quiet row */}
            <Reveal from="right" delay={0.15}>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-white/10 pt-7">
                <a
                  href={site.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-lift inline-flex items-center gap-2.5 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-forest-950"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12.04 2c-5.5 0-9.94 4.44-9.94 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.49 0 9.94-4.44 9.94-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.16c-.24.68-1.42 1.32-1.96 1.36-.5.05-1.14.07-1.84-.11-.42-.13-.97-.31-1.66-.61-2.93-1.26-4.84-4.2-4.99-4.4-.14-.2-1.19-1.58-1.19-3.02 0-1.43.75-2.13 1.02-2.43.27-.29.58-.36.78-.36l.55.01c.18 0 .42-.07.65.5.24.59.82 2.02.89 2.17.07.14.12.31.02.5-.09.2-.14.31-.28.48-.14.16-.29.37-.42.49-.14.14-.28.29-.12.57.16.27.71 1.17 1.53 1.9 1.05.93 1.93 1.22 2.21 1.36.27.14.43.12.59-.07.16-.2.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.61.76 1.88.9.27.14.46.2.53.32.07.11.07.66-.17 1.34Z" />
                  </svg>
                  Start chatting on WhatsApp
                </a>
                <p className="max-w-xs text-xs leading-relaxed text-sage-light/60">
                  In a real emergency Manu escalates to{" "}
                  <strong className="font-semibold text-ivory">Tele-MANAS, 14416</strong> — free and
                  confidential, 24x7.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
