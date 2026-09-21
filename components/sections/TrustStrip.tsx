"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import CountUp from "@/components/ui/CountUp";
import { REGIONS, type Region } from "@/lib/palette";
import { stats } from "@/lib/site";
import { useLiteMotion } from "@/lib/use-lite-motion";

/*
 * Four small cards, each tinted with a colour from the brain palette and each
 * with a tiny picture of what its number means, drawn as it scrolls in:
 *
 *   sessions        a grid of dots lighting up, one per conversation   (teal)
 *   psychologists   five faces joining, one after another              (rose)
 *   languages       "नमस्ते" and "Hello" answering each other           (indigo)
 *   rating          five stars filling to 4.9                          (gold)
 *
 * The numbers stay in the site's dark green so they read crisply; the colour
 * lives in the card and the picture. With reduced motion everything simply
 * appears in its finished state.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

// the rating's gold is too pale for small marks on cream, so its drawings use a deeper gold
const INK: Record<string, string> = { amber: "#A98943" };
const ink = (r: Region) => INK[r.id] ?? r.hex;
const tint = (r: Region, a: number) => `rgba(${r.rgb[0]},${r.rgb[1]},${r.rgb[2]},${a})`;

const card: Variants = {
  hidden: { opacity: 0, y: 26 },
  shown: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.1, ease: EASE } }),
};

/* ---------------------------------------------------------------- pictures */

function SessionDots({ region, animate }: { region: Region; animate: boolean }) {
  const cols = 10;
  const rows = 4;
  return (
    <div
      className="grid gap-[5px]"
      style={{ gridTemplateColumns: `repeat(${cols}, 6px)` }}
      aria-hidden="true"
    >
      {Array.from({ length: cols * rows }, (_, i) => (
        <motion.span
          key={i}
          className="h-[6px] w-[6px] rounded-full"
          initial={animate ? { backgroundColor: tint(region, 0.15), scale: 0.6 } : false}
          whileInView={{ backgroundColor: ink(region), scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: animate ? 0.35 + i * 0.03 : 0, duration: 0.3 }}
        />
      ))}
    </div>
  );
}

function Faces({ region, animate }: { region: Region; animate: boolean }) {
  const shades = [1, 0.85, 0.7, 0.85, 1];
  return (
    <div className="flex items-center" aria-hidden="true">
      {shades.map((o, i) => (
        <motion.span
          key={i}
          className="-ml-2 flex h-9 w-9 items-end justify-center overflow-hidden rounded-full border-2 border-ivory-light first:ml-0"
          style={{ backgroundColor: tint(region, 0.22 + i * 0.04) }}
          initial={animate ? { scale: 0, opacity: 0 } : false}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: animate ? 0.4 + i * 0.14 : 0, type: "spring", stiffness: 380, damping: 18 }}
        >
          {/* head and shoulders */}
          <svg width="24" height="26" viewBox="0 0 24 26" fill={ink(region)} style={{ opacity: o }}>
            <circle cx="12" cy="9" r="5" />
            <path d="M2 26c0-6 4.5-10 10-10s10 4 10 10z" />
          </svg>
        </motion.span>
      ))}
    </div>
  );
}

function Bubbles({ region, animate }: { region: Region; animate: boolean }) {
  const bubble = (text: string, filled: boolean, delay: number, side: "left" | "right", deva = false) => (
    <motion.span
      className={`relative inline-block rounded-2xl px-3 py-[3px] text-[0.8rem] font-medium ${deva ? "font-deva leading-normal" : "leading-snug"} ${side === "left" ? "rounded-bl-sm" : "rounded-br-sm"}`}
      style={filled ? { backgroundColor: ink(region), color: "#FCFAF6" } : { backgroundColor: tint(region, 0.16), color: ink(region) }}
      initial={animate ? { opacity: 0, y: 8, scale: 0.85 } : false}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: animate ? delay : 0, type: "spring", stiffness: 320, damping: 20 }}
    >
      {text}
    </motion.span>
  );
  return (
    <div className="flex w-32 flex-col gap-1" aria-hidden="true">
      <span className="self-start">{bubble("नमस्ते", true, 0.45, "left", true)}</span>
      <span className="self-end">{bubble("Hello", false, 0.85, "right")}</span>
    </div>
  );
}

function Stars({ region, animate, value }: { region: Region; animate: boolean; value: number }) {
  const star = "M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8z";
  return (
    <div className="relative" aria-hidden="true">
      {/* empty stars */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} width="22" height="22" viewBox="0 0 24 24" fill={tint(region, 0.25)}>
            <path d={star} />
          </svg>
        ))}
      </div>
      {/* filled stars, uncovered left to right up to the rating */}
      <motion.div
        className="absolute inset-y-0 left-0 flex gap-1 overflow-hidden"
        initial={animate ? { width: "0%" } : false}
        whileInView={{ width: `${(value / 5) * 100}%` }}
        viewport={{ once: true }}
        transition={{ delay: animate ? 0.4 : 0, duration: 1.6, ease: EASE }}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} width="22" height="22" viewBox="0 0 24 24" fill={ink(region)} className="shrink-0">
            <path d={star} />
          </svg>
        ))}
      </motion.div>
    </div>
  );
}

/* ---------------------------------------------------------------- strip */

export default function TrustStrip() {
  const reduced = useReducedMotion();
  const lite = useLiteMotion();
  const animate = !reduced && !lite;

  const pictures: { region: Region; picture: (value: number) => ReactNode }[] = [
    { region: REGIONS.teal, picture: () => <SessionDots region={REGIONS.teal} animate={animate} /> },
    { region: REGIONS.rose, picture: () => <Faces region={REGIONS.rose} animate={animate} /> },
    { region: REGIONS.indigo, picture: () => <Bubbles region={REGIONS.indigo} animate={animate} /> },
    { region: REGIONS.amber, picture: (v) => <Stars region={REGIONS.amber} animate={animate} value={v} /> },
  ];

  return (
    <section className="bg-ivory py-10 md:py-14">
      <div className="wrap-wide grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s, i) => {
          const { region, picture } = pictures[i % pictures.length];
          return (
            <motion.div
              key={s.label}
              custom={i}
              variants={card}
              initial={animate ? "hidden" : false}
              whileInView="shown"
              viewport={{ once: true, margin: "-8% 0px" }}
              className="group flex flex-col items-center justify-between gap-4 rounded-3xl border px-4 py-6 text-center transition-shadow duration-500 ease-silk hover:shadow-lift sm:px-6 md:py-7"
              style={{ backgroundColor: tint(region, 0.07), borderColor: tint(region, 0.18) }}
            >
              <div className="flex h-16 items-center justify-center transition-transform duration-500 ease-silk group-hover:scale-105">
                {picture(s.value)}
              </div>
              <div className="transition-transform duration-500 ease-silk group-hover:-translate-y-0.5">
                <p className="font-display text-4xl font-medium leading-none text-forest-900 md:text-5xl">
                  <CountUp value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
                </p>
                <p className="mt-2 text-[0.85rem] tracking-wide text-ink/65 md:text-sm">{s.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
