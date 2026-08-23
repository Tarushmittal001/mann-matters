"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import CountUp from "@/components/ui/CountUp";

/* Warm hues on purpose — these are the uncomfortable numbers, and warm
   reads as urgent where the rest of the page reads as calm. */
const stats = [
  {
    label: "Avoid therapy due to stigma",
    value: 90,
    suffix: "%",
    from: "#F0B429",
    to: "#E36A3B",
  },
  {
    label: "Prefer AI confidants initially",
    value: 50,
    suffix: "%+",
    from: "#E36A3B",
    to: "#E14D7C",
  },
  {
    label: "Cases untreated (WHO)",
    value: 1,
    suffix: " in 7",
    display: "1 in 7",
    from: "#E14D7C",
    to: "#7C4D9B",
  },
];

function CircularProgress({ value, inView }: { value: number; inView: boolean }) {
  const r = 110;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative mx-auto h-64 w-64 sm:h-72 sm:w-72">
      {/* the ring's own glow, so the colour spills past the stroke */}
      <div
        className="absolute inset-6 rounded-full blur-3xl"
        style={{
          background:
            "conic-gradient(from 180deg, rgba(240,180,41,0.5), rgba(227,106,59,0.45), rgba(188,74,32,0.42), transparent 75%)",
        }}
        aria-hidden="true"
      />
      <svg viewBox="0 0 260 260" className="relative h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="130" cy="130" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="18" />
        <motion.circle
          cx="130"
          cy="130"
          r={r}
          fill="none"
          stroke="url(#progressGrad)"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={inView ? { strokeDashoffset: offset } : {}}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
        <defs>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F0B429" />
            <stop offset="45%" stopColor="#E36A3B" />
            <stop offset="100%" stopColor="#E14D7C" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sunrise font-display text-5xl font-medium sm:text-6xl">
          {inView ? <CountUp value={value} suffix="%" /> : "0%"}
        </span>
        <span className="mt-1 text-center text-sm leading-tight text-sage-light/70">
          of Indian youth
          <br />
          battle mental health issues
        </span>
      </div>
    </div>
  );
}

function StatBar({
  label,
  value,
  suffix,
  display,
  from,
  to,
  inView,
  delay,
}: {
  label: string;
  value: number;
  suffix: string;
  display?: string;
  from: string;
  to: string;
  inView: boolean;
  delay: number;
}) {
  const barPercent = display ? 14 : value;
  return (
    <div
      className="flex items-center gap-4 rounded-xl border px-5 py-3.5 backdrop-blur-sm"
      style={{ borderColor: `${from}33`, background: `${from}0F` }}
    >
      <span className="w-48 shrink-0 text-sm text-sage-light/85">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${from}, ${to})`,
            boxShadow: `0 0 14px -2px ${to}`,
          }}
          initial={{ width: 0 }}
          animate={inView ? { width: `${barPercent}%` } : {}}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay }}
        />
      </div>
      <span
        className="w-16 text-right font-display text-sm font-medium tabular-nums"
        style={{ color: to }}
      >
        {display ?? `${value}${suffix}`}
      </span>
    </div>
  );
}

export default function TheProblem() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="section relative overflow-hidden bg-forest-950">
      <div className="mesh-cool pointer-events-none absolute inset-0 opacity-90" aria-hidden="true" />

      <div className="wrap-wide relative grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        {/* Left — ring + stats */}
        <div className="space-y-8">
          <CircularProgress value={70} inView={inView} />
          <div className="mx-auto max-w-lg space-y-3">
            {stats.map((s, i) => (
              <StatBar key={s.label} {...s} inView={inView} delay={0.6 + i * 0.2} />
            ))}
          </div>
        </div>

        {/* Right — editorial copy */}
        <div>
          <motion.p
            className="eyebrow mb-4 flex items-center gap-3 !text-haldi"
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gulaal" aria-hidden="true" />
            The Problem
          </motion.p>
          <motion.h2
            className="h-display text-4xl !text-ivory md:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.35, duration: 0.6 }}
          >
            India&rsquo;s youth carry a{" "}
            <em className="text-sunrise italic">silent weight.</em>
          </motion.h2>
          <motion.div
            className="rule-spectrum mb-8 mt-3 w-24"
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.6 }}
            style={{ transformOrigin: "left" }}
          />
          <motion.div
            className="space-y-5 text-[1.05rem] leading-relaxed text-ivory/75"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <p>
              <strong className="font-semibold text-haldi">350M+</strong> young Indians
              carry anxiety from exams, jobs and social media. Yet 90% avoid therapy —
              not because they don&rsquo;t want help, but because help feels clinical,
              expensive and scary.
            </p>
            <p>
              So we put it where they already are:{" "}
              <strong className="font-semibold text-mor-light">WhatsApp.</strong>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
