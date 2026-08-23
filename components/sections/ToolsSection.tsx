"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import { BreathIcon, CheckInIcon, MatchIcon } from "@/components/icons/ToolIcons";
import ToolRail from "@/components/sections/ToolRail";
import { concernMap, expertsFor } from "@/lib/matching";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ── shared card chrome ─────────────────────────────────────────────── */

/* `tint` is the card's colour: it paints the top edge, the icon halo, the
   border and the heading, so each of the three tools is recognisable at a
   glance rather than being one of three identical cream boxes. */
function ToolCard({
  icon,
  title,
  prompt,
  children,
  footer,
  tint,
  ink,
}: {
  icon: React.ReactNode;
  title: string;
  prompt: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  tint: string;
  ink: string;
}) {
  return (
    <div
      className="edge-top card-lift flex h-full flex-col overflow-hidden rounded-2xl border bg-ivory-light p-7 shadow-lift"
      style={{
        borderColor: `${tint}33`,
        backgroundImage: `radial-gradient(ellipse 90% 60% at 100% 0%, ${tint}1A, transparent 62%)`,
        ["--edge" as string]: `linear-gradient(90deg, ${tint}, ${tint}55)`,
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
          style={{ background: `${tint}1F`, color: ink }}
        >
          {icon}
        </span>
        <h3 className="font-display text-[1.3rem] font-medium leading-snug" style={{ color: ink }}>
          {title}
        </h3>
      </div>
      <p className="mt-2.5 text-[0.92rem] leading-relaxed text-ink/60">{prompt}</p>
      <div className="mt-6 flex-1">{children}</div>
      <div
        className="mt-6 border-t pt-4 text-sm"
        style={{ borderColor: `${tint}2E` }}
      >
        {footer}
      </div>
    </div>
  );
}

function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="link-draw group/link inline-flex items-center gap-1.5 font-semibold text-kesar-ink"
    >
      {children}
      <span
        className="transition-transform duration-500 ease-silk group-hover/link:translate-x-1"
        aria-hidden="true"
      >
        →
      </span>
    </Link>
  );
}

/* ── 1. breathe, right here ─────────────────────────────────────────── */

const PHASES = [
  { label: "Breathe in", scale: 1, dur: 4 },
  { label: "Hold", scale: 1, dur: 4 },
  { label: "Breathe out", scale: 0.55, dur: 4 },
  { label: "Hold", scale: 0.55, dur: 4 },
] as const;

function BreatheCard() {
  const reduce = useReducedMotion();
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [cycles, setCycles] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!running) return;
    timer.current = setTimeout(() => {
      setPhase((prev) => {
        const next = (prev + 1) % PHASES.length;
        if (next === 0) setCycles((c) => c + 1);
        return next;
      });
    }, PHASES[phase].dur * 1000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [running, phase]);

  const toggle = () => {
    if (running) {
      setRunning(false);
      setPhase(0);
    } else {
      setRunning(true);
    }
  };

  const current = PHASES[phase];
  const scale = reduce ? 0.8 : running ? current.scale : 0.66;
  const roundLabel = cycles === 1 ? "1 round done" : cycles + " rounds done";

  return (
    <ToolCard
      tint="#0E9FA6"
      ink="#076166"
      icon={<BreathIcon size={26} />}
      title="Take a breath"
      prompt="Four counts in, four to hold, four out. One round is enough to slow a racing mind."
      footer={<CardLink href="/breathe">Full exercise, with sound</CardLink>}
    >
      <div className="flex flex-col items-center">
        <div className="relative grid h-[168px] w-[168px] place-items-center">
          <span className="absolute inset-0 rounded-full border border-forest-800/10" aria-hidden="true" />
          <span className="absolute inset-6 rounded-full border border-forest-800/10" aria-hidden="true" />
          <motion.span
            className="absolute h-[104px] w-[104px] rounded-full"
            style={{
              background:
                "radial-gradient(circle at 34% 28%, #9FE8EC, #4FCBD1 45%, #0E9FA6 78%, #4356CE 100%)",
              boxShadow: "0 0 44px -6px rgba(14,159,166,0.55)",
            }}
            animate={{ scale }}
            transition={{ duration: reduce ? 0 : current.dur, ease: "easeInOut" }}
            aria-hidden="true"
          />
          <span
            className="relative z-10 font-display text-sm text-forest-900/80"
            aria-live="polite"
          >
            {running ? current.label : ""}
          </span>
        </div>

        <button
          type="button"
          onClick={toggle}
          className="mt-4 rounded-full border border-forest-800/20 px-6 py-2 text-sm font-semibold text-forest-800 transition-colors hover:border-forest-800 hover:bg-forest-800 hover:text-ivory"
        >
          {running ? "Stop" : cycles > 0 ? "Go again" : "Begin"}
        </button>
        <p className="mt-2 h-4 text-xs text-ink/45">{cycles > 0 ? roundLabel : " "}</p>
      </div>
    </ToolCard>
  );
}

/* ── 2. how are you, right now ──────────────────────────────────────── */

const moods = [
  {
    id: "heavy",
    sub: "heavy",
    label: "Bhaari",
    dot: "#5B3475",
    reply:
      "That's a lot to be carrying on your own. Saying it out loud to someone trained to listen helps more than most people expect.",
    step: { label: "Find someone to talk to", href: "/match" },
  },
  {
    id: "off",
    sub: "not quite right",
    label: "Thoda off",
    dot: "#4356CE",
    reply:
      "Not wrong, not right — just off. Worth noticing now, while it's still small enough to name.",
    step: { label: "Take the full check-in", href: "/check-in" },
  },
  {
    id: "okay",
    sub: "getting by",
    label: "Theek-thaak",
    dot: "#0E9FA6",
    reply:
      "“Theek hoon” does a lot of heavy lifting in this country. Four questions will tell you more than it does.",
    step: { label: "Take the full check-in", href: "/check-in" },
  },
  {
    id: "light",
    sub: "lighter today",
    label: "Halka",
    dot: "#E36A3B",
    reply:
      "Good. Calm days are the easiest time to build the habit, so it's already there on the harder ones.",
    step: { label: "Try a breathing round", href: "/breathe" },
  },
  {
    id: "good",
    sub: "genuinely good",
    label: "Achha",
    dot: "#F0B429",
    reply:
      "Lovely. Whatever you're doing right now, keep some of it — that's worth knowing about yourself.",
    step: { label: "Browse the free tools", href: "/tools" },
  },
] as const;

function MoodCard() {
  const [picked, setPicked] = useState<number | null>(null);
  const mood = picked === null ? null : moods[picked];

  return (
    <ToolCard
      tint="#F0B429"
      ink="#8A5A00"
      icon={<CheckInIcon size={26} />}
      title="How are you, right now?"
      prompt="One tap. No score, no diagnosis — just an honest word for today."
      footer={<CardLink href="/check-in">The full two-minute check-in</CardLink>}
    >
      {/* the dial */}
      <div className="relative">
        <span
          className="absolute left-[10%] right-[10%] top-[13px] h-px bg-forest-800/15"
          aria-hidden="true"
        />
        <div
          className="relative flex items-start justify-between"
          role="group"
          aria-label="How you feel right now"
        >
          {moods.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setPicked(i)}
              aria-pressed={picked === i}
              aria-label={m.label + " — " + m.sub}
              title={m.sub}
              className="group/mood flex w-1/5 flex-col items-center gap-2 text-center"
            >
              <span className="grid h-[26px] w-[26px] place-items-center">
                <motion.span
                  className="block rounded-full"
                  style={{ background: m.dot }}
                  animate={{
                    width: picked === i ? 22 : 13,
                    height: picked === i ? 22 : 13,
                    opacity: picked === null || picked === i ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.4, ease: EASE }}
                />
              </span>
              <span
                className={
                  "text-[0.7rem] leading-tight transition-colors " +
                  (picked === i
                    ? "font-semibold text-forest-900"
                    : "text-ink/50 group-hover/mood:text-forest-800")
                }
              >
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* the reflection */}
      <div className="mt-6 min-h-[136px]">
        <AnimatePresence mode="wait">
          {mood ? (
            <motion.div
              key={mood.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-haldi-ink">
                {mood.label} · {mood.sub}
              </p>
              <p className="font-display text-[0.95rem] italic leading-relaxed text-forest-800">
                {mood.reply}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link
                  href={mood.step.href}
                  className="rounded-full bg-haldi-ink px-5 py-2 text-xs font-semibold text-ivory transition-colors hover:bg-kesar-ink"
                >
                  {mood.step.label}
                </Link>
                <button
                  type="button"
                  onClick={() => setPicked(null)}
                  className="link-draw text-xs text-ink/50"
                >
                  Start over
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-[0.92rem] leading-relaxed text-ink/45"
            >
              Pick the one that&apos;s closest. Nothing is stored, and no one is told.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </ToolCard>
  );
}

/* ── 3. who fits you ────────────────────────────────────────────────── */

function MatchCard() {
  const [pickedId, setPickedId] = useState<string | null>(null);
  const concern = concernMap.find((c) => c.id === pickedId) ?? null;

  const matches = concern ? expertsFor(concern.keys) : [];
  const languages = Array.from(new Set(matches.flatMap((e) => e.languages)));
  const from = matches.length ? Math.min(...matches.map((e) => e.price)) : 0;
  const top = matches[0];

  return (
    <ToolCard
      tint="#7C4D9B"
      ink="#5B3475"
      icon={<MatchIcon size={26} />}
      title="Who fits you?"
      prompt="Tap what's weighing on you most. We'll show you who works on it."
      footer={
        <CardLink href={concern ? "/match?concern=" + concern.id : "/match"}>
          {concern ? "See your best match" : "Answer three questions instead"}
        </CardLink>
      }
    >
      <ul className="flex flex-wrap gap-2">
        {concernMap.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => setPickedId(pickedId === c.id ? null : c.id)}
              aria-pressed={pickedId === c.id}
              className={
                "rounded-full border px-3.5 py-1.5 text-[0.78rem] font-medium transition-colors duration-300 ease-silk " +
                (pickedId === c.id
                  ? "border-jamun bg-jamun text-ivory shadow-neel"
                  : "border-jamun/35 text-ink/65 hover:border-jamun/70 hover:text-jamun-ink")
              }
            >
              {c.short}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 min-h-[136px]">
        <AnimatePresence mode="wait">
          {concern && top ? (
            <motion.div
              key={concern.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="rounded-xl border border-jamun/25 bg-jamun/[0.07] p-4"
            >
              <p className="font-display text-2xl font-medium leading-snug text-forest-900">
                {matches.length}{" "}
                <span className="text-base font-normal text-ink/60">
                  psychologist{matches.length === 1 ? "" : "s"} for{" "}
                  {concern.short.toLowerCase()}
                </span>
              </p>
              <dl className="mt-3 space-y-1.5 text-[0.82rem] text-ink/65">
                <div className="flex gap-2">
                  <dt className="w-14 shrink-0 text-ink/45">Speaks</dt>
                  <dd>{languages.join(", ")}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-14 shrink-0 text-ink/45">From</dt>
                  <dd>₹{from.toLocaleString("en-IN")} a session</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-14 shrink-0 text-ink/45">Top fit</dt>
                  <dd>
                    {top.name} · {top.experience}
                  </dd>
                </div>
              </dl>
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-[0.92rem] leading-relaxed text-ink/45"
            >
              Every psychologist here is RCI-licensed and sees people online, so
              where you live never narrows the list.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </ToolCard>
  );
}

/* ── the section ────────────────────────────────────────────────────── */

export default function ToolsSection() {
  return (
    <section className="section relative overflow-hidden bg-sage-light/25">
      <div className="mesh-warm pointer-events-none absolute inset-0 opacity-80" aria-hidden="true" />
      <div className="wrap-wide relative">
        <SectionHeading
          eyebrow="free, right now"
          deva="मन"
          title="Small tools for a heavy day"
          description="You don't need an appointment to start feeling a little better. The first three run right here on this page; the rest of the toolkit is one scroll away. All free, all private."
        />

        <div className="grid gap-5 md:grid-cols-3">
          <Reveal from="scale" className="h-full">
            <BreatheCard />
          </Reveal>
          <Reveal from="scale" delay={0.1} className="h-full">
            <MoodCard />
          </Reveal>
          <Reveal from="scale" delay={0.2} className="h-full">
            <MatchCard />
          </Reveal>
        </div>

        <Reveal delay={0.25}>
          <ToolRail />
        </Reveal>
      </div>
    </section>
  );
}
