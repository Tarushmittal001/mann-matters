"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import CountUp from "@/components/ui/CountUp";

/*
 * On a light ground on purpose. This used to be the same dark forest as "Meet
 * Manu" directly below it, and the two read as one long block with no seam.
 * The problem is now light and Manu stays dark — Manu's chat demo is a light
 * card, and it stands out best against the dark — so the page alternates
 * light, dark, light instead of dark, dark.
 */

const stats = [
  { label: "Avoid therapy due to stigma", value: 90, suffix: "%" },
  { label: "Prefer AI confidants initially", value: 50, suffix: "%+" },
  { label: "Cases untreated (WHO)", value: 1, suffix: " in 7", display: "1 in 7" },
];

function CircularProgress({ value, inView }: { value: number; inView: boolean }) {
  const r = 110;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72">
      <svg viewBox="0 0 260 260" className="w-full h-full -rotate-90" aria-hidden="true">
        {/* Track */}
        <circle
          cx="130"
          cy="130"
          r={r}
          fill="none"
          stroke="rgba(14,59,51,0.08)"
          strokeWidth="18"
        />
        {/* Progress */}
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
          {/* forest into mint — the old sage-on-sage ring disappears on a light ground */}
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1A5A4D" />
            <stop offset="100%" stopColor="#5FA98A" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl sm:text-6xl font-medium text-forest-800">
          {inView ? <CountUp value={value} suffix="%" /> : "0%"}
        </span>
        <span className="mt-1 text-sm text-ink/55 text-center leading-tight">
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
  inView,
  delay,
}: {
  label: string;
  value: number;
  suffix: string;
  display?: string;
  inView: boolean;
  delay: number;
}) {
  const barPercent = display ? 14 : value;
  return (
    <div className="flex items-center gap-4 rounded-xl border border-forest-800/10 bg-ivory-light px-5 py-3.5 shadow-lift">
      <span className="text-sm text-ink/70 w-48 shrink-0">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-forest-800/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-forest-700 to-[#5FA98A]"
          initial={{ width: 0 }}
          animate={inView ? { width: `${barPercent}%` } : {}}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay }}
        />
      </div>
      <span className="text-sm font-display font-medium text-forest-800 w-16 text-right tabular-nums">
        {display ?? `${value}${suffix}`}
      </span>
    </div>
  );
}

export default function TheProblem() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="section relative overflow-hidden bg-sage-light/40">
      {/* Subtle radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.7) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="wrap-wide relative grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        {/* Left — ring + stats */}
        <div className="space-y-8">
          <CircularProgress value={70} inView={inView} />
          <div className="space-y-3 max-w-lg mx-auto">
            {stats.map((s, i) => (
              <StatBar key={s.label} {...s} inView={inView} delay={0.6 + i * 0.2} />
            ))}
          </div>
        </div>

        {/* Right — editorial copy */}
        <div>
          <motion.p
            className="eyebrow mb-4"
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            The Problem
          </motion.p>
          <motion.h2
            className="h-display text-4xl md:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.35, duration: 0.6 }}
          >
            India&rsquo;s youth carry a{" "}
            <em className="text-forest-600 italic">silent weight.</em>
          </motion.h2>
          <motion.div
            className="mt-2 mb-8 h-px w-16 bg-gold/60"
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.6 }}
            style={{ transformOrigin: "left" }}
          />
          <motion.div
            className="space-y-5 text-[1.05rem] leading-relaxed text-ink/70"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <p>
              350M+ young Indians carry anxiety from exams, jobs and social media.
              Yet 90% avoid therapy — not because they don&rsquo;t want help, but because
              help feels clinical, expensive and scary.
            </p>
            <p>
              So we put it where they already are:{" "}
              <strong className="font-semibold text-forest-900">WhatsApp.</strong>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
