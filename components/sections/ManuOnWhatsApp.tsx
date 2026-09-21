"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import Reveal from "@/components/ui/Reveal";
import TryManuDemo from "@/components/TryManu/TryManuDemo";
import { REGIONS, type Region } from "@/lib/palette";
import { useLiteMotion } from "@/lib/use-lite-motion";

/*
 * The chat on the left is the real thing, so it stays. The right side used to
 * be three tabs of paragraphs; now it is six small living tiles, each showing
 * its feature in a tiny loop instead of describing it:
 *
 *   talks your language   the greeting keeps switching language      (mint)
 *   anonymous             a name blurs away into dots                 (violet)
 *   mood, tracked gently  a week of mood bars rising and falling      (teal)
 *   streaks               seven days light up into a Bronze badge     (amber)
 *   CBT & DBT tools       a breathing circle, in and out              (moss)
 *   a real psychologist   a heartbeat line, a human on call           (rose)
 *
 * Loops only run while the section is on screen, and not at all for people
 * who ask for reduced motion; they see each tile's settled state.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const tint = (r: Region, a: number) => `rgba(${r.rgb[0]},${r.rgb[1]},${r.rgb[2]},${a})`;

type Live = { live: boolean; region: Region };

/* ---------------------------------------------------------------- tile art */

function Languages({ live, region }: Live) {
  const lines = ["Kaisa feel ho raha hai?", "कैसा महसूस हो रहा है?", "How are you feeling?"];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!live) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % lines.length), 2200);
    return () => window.clearInterval(t);
  }, [live, lines.length]);

  return (
    <div className="relative h-9 w-60 max-w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.span
          key={i}
          className={`absolute left-0 top-0 inline-block whitespace-nowrap rounded-2xl rounded-bl-sm px-3 py-1.5 text-[0.8rem] font-medium ${i === 1 ? "font-deva" : ""}`}
          style={{ backgroundColor: tint(region, 0.2), color: region.hex }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          {lines[i]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function Anonymous({ live, region }: Live) {
  return (
    <div className="flex h-9 items-center gap-2.5">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: tint(region, 0.2) }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={region.hex} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9 4.5 10 7-.4 1-1.2 2.3-2.4 3.5M6.2 6.3C4.2 7.6 2.7 9.6 2 12c1 2.5 5 7 10 7 1.7 0 3.2-.5 4.6-1.2" />
        </svg>
      </span>
      <span className="relative h-5 w-28">
        <motion.span
          className="absolute inset-0 text-[0.85rem] font-medium text-ivory"
          animate={live ? { opacity: [1, 1, 0, 0, 1], filter: ["blur(0px)", "blur(0px)", "blur(6px)", "blur(6px)", "blur(0px)"] } : { opacity: 0 }}
          transition={live ? { duration: 4.5, repeat: Infinity, times: [0, 0.3, 0.45, 0.85, 1] } : { duration: 0 }}
        >
          Priya S., 21
        </motion.span>
        <motion.span
          className="absolute inset-0 text-[0.85rem] font-semibold tracking-[0.25em]"
          style={{ color: region.hex }}
          animate={live ? { opacity: [0, 0, 1, 1, 0] } : { opacity: 1 }}
          transition={live ? { duration: 4.5, repeat: Infinity, times: [0, 0.35, 0.5, 0.85, 1] } : { duration: 0 }}
        >
          ••••••
        </motion.span>
      </span>
    </div>
  );
}

function Mood({ live, region }: Live) {
  // a believable week: a dip mid-week, a climb by Sunday
  const weeks = [
    [0.55, 0.4, 0.3, 0.45, 0.6, 0.7, 0.85],
    [0.45, 0.6, 0.5, 0.35, 0.55, 0.8, 0.75],
  ];
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!live) return;
    const t = window.setInterval(() => setW((n) => (n + 1) % weeks.length), 2600);
    return () => window.clearInterval(t);
  }, [live, weeks.length]);

  return (
    <div className="flex h-9 items-end gap-1.5" aria-hidden="true">
      {weeks[w].map((h, i) => (
        <motion.span
          key={i}
          className="w-3 rounded-full"
          style={{ backgroundColor: i === 6 ? region.hex : tint(region, 0.45) }}
          animate={{ height: `${Math.round(h * 36)}px` }}
          transition={{ duration: 0.7, delay: live ? i * 0.05 : 0, ease: EASE }}
        />
      ))}
    </div>
  );
}

function Streak({ live, region }: Live) {
  const [lit, setLit] = useState(live ? 0 : 7);
  useEffect(() => {
    if (!live) {
      setLit(7);
      return;
    }
    // light one day at a time, hold the badge, start again
    const t = window.setInterval(() => setLit((n) => (n >= 10 ? 0 : n + 1)), 420);
    return () => window.clearInterval(t);
  }, [live]);
  const done = lit >= 7;

  return (
    <div className="flex h-9 items-center gap-2" aria-hidden="true">
      <div className="flex gap-1">
        {Array.from({ length: 7 }, (_, i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full transition-colors duration-300"
            style={{ backgroundColor: i < lit ? region.hex : "rgba(255,255,255,0.12)" }}
          />
        ))}
      </div>
      <motion.span
        className="rounded-full px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-forest-950"
        style={{ backgroundColor: region.hex }}
        animate={{ scale: done ? 1 : 0.6, opacity: done ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 18 }}
      >
        Bronze
      </motion.span>
    </div>
  );
}

function Breathe({ live, region }: Live) {
  const [phase, setPhase] = useState<"in" | "out">("in");
  useEffect(() => {
    if (!live) return;
    const t = window.setInterval(() => setPhase((p) => (p === "in" ? "out" : "in")), 3000);
    return () => window.clearInterval(t);
  }, [live]);

  return (
    <div className="flex h-9 items-center gap-3" aria-hidden="true">
      <span className="relative flex h-9 w-9 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: tint(region, 0.25) }}
          animate={{ scale: live ? (phase === "in" ? 1 : 0.55) : 0.8 }}
          transition={{ duration: 3, ease: "easeInOut" }}
        />
        <span className="relative h-2.5 w-2.5 rounded-full" style={{ backgroundColor: region.hex }} />
      </span>
      <span className="text-[0.8rem] font-medium" style={{ color: region.hex }}>
        {live ? (phase === "in" ? "Breathe in…" : "…and out") : "Breathe"}
      </span>
    </div>
  );
}

function Human({ live, region }: Live) {
  return (
    <div className="flex h-9 items-center" aria-hidden="true">
      <svg width="120" height="30" viewBox="0 0 120 30" fill="none">
        <path d="M0 15h34l6-10 8 20 7-14 4 4h61" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <motion.path
          d="M0 15h34l6-10 8 20 7-14 4 4h61"
          stroke={region.hex}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: live ? 0 : 1 }}
          animate={live ? { pathLength: [0, 1, 1], opacity: [1, 1, 0] } : { pathLength: 1 }}
          transition={live ? { duration: 2.4, repeat: Infinity, times: [0, 0.7, 1], ease: "easeInOut" } : { duration: 0 }}
        />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------- tiles */

const tiles: {
  title: string;
  line: string;
  region: Region;
  Art: (p: Live) => ReactNode;
  wide?: boolean;
}[] = [
  { title: "Talks your language", line: "Hinglish, Hindi or English, mid-sentence.", region: REGIONS.mint, Art: Languages, wide: true },
  { title: "Anonymous, if you want", line: "No name, no number stored.", region: REGIONS.violet, Art: Anonymous },
  { title: "Mood, tracked gently", line: "One “Mood aaj?” a day.", region: REGIONS.teal, Art: Mood },
  { title: "Streaks that stick", line: "Seven days in a row earns Bronze.", region: REGIONS.amber, Art: Streak },
  { title: "CBT & DBT tools", line: "Grounding and breathing, one tap.", region: REGIONS.moss, Art: Breathe },
  { title: "A real psychologist", line: "Steps in at any sign of harm.", region: REGIONS.rose, Art: Human, wide: true },
];

export default function ManuOnWhatsApp() {
  const reduced = useReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);
  const inView = useInView(gridRef, { margin: "-10% 0px" });
  // the tiles loop forever; on a phone they show their settled state instead
  const lite = useLiteMotion();
  const live = inView && !reduced && !lite;

  return (
    <section id="manu" className="section relative scroll-mt-20 overflow-hidden bg-forest-950 text-ivory">
      {/* two slow drifting glows, so the dark ground itself feels alive */}
      {!reduced && (
        <>
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute -left-40 top-10 h-[28rem] w-[28rem] rounded-full blur-3xl"
            style={{ background: tint(REGIONS.mint, 0.12) }}
            animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 bottom-0 h-[26rem] w-[26rem] rounded-full blur-3xl"
            style={{ background: tint(REGIONS.amber, 0.1) }}
            animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      <div className="wrap-wide relative">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] lg:gap-16">
          {/* Left — the live demo does the talking */}
          <Reveal from="left" className="min-w-0">
            <TryManuDemo embedded />
          </Reveal>

          {/* Right — heading, then the feature tiles */}
          <div className="min-w-0">
            <Reveal from="right">
              <p className="eyebrow mb-4 flex items-center gap-3 text-sage">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  {!reduced && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5FA98A] opacity-70" />
                  )}
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5FA98A]" />
                </span>
                on whatsapp, 24x7
              </p>
              <h2 className="h-display text-4xl !text-ivory md:text-5xl">
                Meet Manu — your <em className="italic text-sage">4 a.m. dost</em>
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-sage-light/75">
                No new app, no waiting room. Try it right here.
              </p>
            </Reveal>

            <div ref={gridRef} className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {tiles.map((t, i) => (
                <motion.div
                  key={t.title}
                  className={`group rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors duration-500 hover:bg-white/[0.07] ${t.wide ? "sm:col-span-2" : ""}`}
                  initial={reduced ? false : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10% 0px" }}
                  transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease: EASE }}
                  whileHover={reduced ? undefined : { y: -3 }}
                >
                  <div className={t.wide ? "sm:flex sm:items-center sm:justify-between sm:gap-6" : ""}>
                    <div className={t.wide ? "mb-3 sm:mb-0" : "mb-3"}>
                      <h3 className="flex items-center gap-2 font-display text-[1.05rem] font-medium text-ivory">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.region.hex }} aria-hidden="true" />
                        {t.title}
                      </h3>
                      <p className="mt-0.5 text-[0.82rem] text-sage-light/65">{t.line}</p>
                    </div>
                    <div className={t.wide ? "sm:shrink-0" : ""}>
                      <t.Art live={live} region={t.region} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* the WhatsApp and sign-in buttons now live inside the chat card */}
            <Reveal from="right" delay={0.15}>
              <p className="mt-6 max-w-sm text-xs leading-relaxed text-sage-light/60">
                In an emergency Manu hands you to{" "}
                <strong className="font-semibold text-ivory">Tele-MANAS, 14416</strong>, free and 24x7.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
