"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { REGIONS, type Region } from "@/lib/palette";

/*
 * Show, don't tell. Each step is a card with a tiny moving preview of that
 * moment in the product, and one short line under its title, so the section
 * reads at a glance instead of as three paragraphs.
 *
 *   01  choose   filter chips switch on, one therapist gets picked   (indigo: focus)
 *   02  time     a day, then a slot, get chosen                      (gold: time well spent)
 *   03  meet     a private video room goes live, the timer runs      (mint: calm, safe)
 *
 * Every preview plays once when it scrolls into view. With reduced motion
 * they simply show their finished state.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const tint = (r: Region, a: number) => `rgba(${r.rgb[0]},${r.rgb[1]},${r.rgb[2]},${a})`;
// brand gold is too pale for small marks on cream
const ink = (r: Region) => (r.id === "amber" ? "#A98943" : r.hex);

type Pop = { animate: boolean; region: Region };

/** Something that appears at `delay` seconds after the card enters view. */
function Appear({
  animate,
  delay,
  children,
  className,
  from = { opacity: 0, y: 8 },
}: {
  animate: boolean;
  delay: number;
  children: ReactNode;
  className?: string;
  from?: Record<string, number>;
}) {
  return (
    <motion.div
      className={className}
      initial={animate ? from : false}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ delay: animate ? delay : 0, duration: 0.5, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** A pill that switches on (fills with colour) at `delay`. */
function Chip({ label, on, delay, animate, region }: Pop & { label: string; on: boolean; delay: number }) {
  return (
    <motion.span
      className="rounded-full border px-2.5 py-1 text-[0.72rem] font-medium"
      initial={animate ? { backgroundColor: "rgba(255,255,255,0.7)", color: "#51605A", borderColor: "rgba(31,45,40,0.12)" } : false}
      whileInView={
        on
          ? { backgroundColor: ink(region), color: "#FCFAF6", borderColor: ink(region) }
          : { backgroundColor: "rgba(255,255,255,0.7)", color: "#51605A", borderColor: "rgba(31,45,40,0.12)" }
      }
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ delay: animate ? delay : 0, duration: 0.35 }}
    >
      {label}
    </motion.span>
  );
}

function ChoosePreview({ animate, region }: Pop) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <Chip label="Anxiety" on delay={0.5} animate={animate} region={region} />
        <Chip label="Hindi" on delay={0.8} animate={animate} region={region} />
        <Chip label="Under ₹1,000" on={false} delay={0} animate={animate} region={region} />
      </div>
      {[
        { name: "Ananya Iyer", note: "Anxiety · Hindi, English", picked: true, delay: 1.1 },
        { name: "Arjun Mehta", note: "Stress · Hindi, Marathi", picked: false, delay: 1.25 },
      ].map((t) => (
        <Appear key={t.name} animate={animate} delay={t.delay}>
          <motion.div
            className="flex items-center gap-3 rounded-2xl border bg-white/80 px-3 py-2.5"
            initial={animate ? { borderColor: "rgba(31,45,40,0.08)" } : false}
            whileInView={{ borderColor: t.picked ? ink(region) : "rgba(31,45,40,0.08)" }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ delay: animate ? 1.7 : 0, duration: 0.4 }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-semibold"
              style={{ backgroundColor: tint(region, 0.16), color: ink(region) }}
            >
              {t.name.split(" ").map((w) => w[0]).join("")}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[0.8rem] font-semibold text-forest-900">{t.name}</span>
              <span className="block truncate text-[0.7rem] text-ink/55">{t.note}</span>
            </span>
            {t.picked && (
              <motion.span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: ink(region) }}
                initial={animate ? { scale: 0 } : false}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ delay: animate ? 1.8 : 0, type: "spring", stiffness: 420, damping: 16 }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2.5 6.2 5 8.5l4.5-5" stroke="#FCFAF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.span>
            )}
          </motion.div>
        </Appear>
      ))}
    </div>
  );
}

function TimePreview({ animate, region }: Pop) {
  const days = [
    { d: "Mon", n: "14" },
    { d: "Tue", n: "15" },
    { d: "Wed", n: "16" },
    { d: "Thu", n: "17" },
  ];
  const slots = ["8:00 am", "12:30 pm", "6:00 pm", "8:00 pm"];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-1.5">
        {days.map((day, i) => (
          <motion.span
            key={day.d}
            className="flex flex-col items-center rounded-xl border py-1.5"
            initial={animate ? { backgroundColor: "rgba(255,255,255,0.8)", color: "#1F2D28", borderColor: "rgba(31,45,40,0.08)" } : false}
            whileInView={
              i === 2
                ? { backgroundColor: ink(region), color: "#FCFAF6", borderColor: ink(region) }
                : { backgroundColor: "rgba(255,255,255,0.8)", color: "#1F2D28", borderColor: "rgba(31,45,40,0.08)" }
            }
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ delay: animate ? 0.7 : 0, duration: 0.35 }}
          >
            <span className="text-[0.62rem] uppercase tracking-wide opacity-70">{day.d}</span>
            <span className="font-display text-base leading-tight">{day.n}</span>
          </motion.span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {slots.map((slot, i) => (
          <Appear key={slot} animate={animate} delay={0.95 + i * 0.1}>
            <motion.span
              className="block rounded-lg border py-1.5 text-center text-[0.75rem] font-medium"
              initial={animate ? { backgroundColor: "rgba(255,255,255,0.8)", color: "#1F2D28", borderColor: "rgba(31,45,40,0.08)" } : false}
              whileInView={
                i === 2
                  ? { backgroundColor: tint(region, 0.22), color: "#5E4A1F", borderColor: ink(region) }
                  : { backgroundColor: "rgba(255,255,255,0.8)", color: "#1F2D28", borderColor: "rgba(31,45,40,0.08)" }
              }
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ delay: animate ? 1.6 : 0, duration: 0.35 }}
            >
              {slot}
            </motion.span>
          </Appear>
        ))}
      </div>
    </div>
  );
}

function MeetPreview({ animate, region }: Pop) {
  return (
    <div className="overflow-hidden rounded-2xl bg-forest-900 p-3 text-left">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[0.68rem] font-medium text-sage-light/80">
          <span className="relative flex h-2 w-2">
            {animate && (
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
                style={{ backgroundColor: region.hex }}
              />
            )}
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: region.hex }} />
          </span>
          Private session
        </span>
        <span className="font-mono text-[0.68rem] text-sage-light/70">50:00</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Your therapist", delay: 0.6 },
          { label: "You", delay: 0.95 },
        ].map((tile) => (
          <Appear
            key={tile.label}
            animate={animate}
            delay={tile.delay}
            from={{ opacity: 0, scale: 0.9 }}
            className="relative flex aspect-[4/3] items-end justify-center overflow-hidden rounded-xl"
          >
            <span className="absolute inset-0" style={{ backgroundColor: tint(region, 0.22) }} />
            <svg width="58" height="53" viewBox="0 0 24 22" fill={region.hex} className="relative -mb-1 opacity-90" aria-hidden="true">
              <circle cx="12" cy="7" r="4.5" />
              <path d="M3 22c0-5 4-8.5 9-8.5s9 3.5 9 8.5z" />
            </svg>
            <span className="absolute left-2 top-1.5 text-[0.6rem] font-medium text-ivory/90">{tile.label}</span>
          </Appear>
        ))}
      </div>
      <Appear animate={animate} delay={1.3} className="mt-2 flex justify-center gap-2">
        {["M4 7h8v6H4zM12 9l4-2v6l-4-2", "M10 3a2 2 0 0 1 2 2v4a2 2 0 0 1-4 0V5a2 2 0 0 1 2-2zM6 9a4 4 0 0 0 8 0M10 13v3"].map((d, i) => (
          <span key={i} className="flex h-7 w-7 items-center justify-center rounded-full bg-ivory/10">
            <svg width="14" height="14" viewBox="0 0 20 19" fill="none" stroke="#F7F4EE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={d} />
            </svg>
          </span>
        ))}
        <span className="flex h-7 items-center rounded-full bg-[#C56A72] px-3 text-[0.62rem] font-semibold text-ivory">End</span>
      </Appear>
    </div>
  );
}

const steps = [
  {
    n: "1",
    title: "Choose your expert",
    line: "Filter by concern, language and budget.",
    region: REGIONS.indigo,
    Preview: ChoosePreview,
  },
  {
    n: "2",
    title: "Pick a time",
    line: "Mornings, evenings or weekends.",
    region: REGIONS.amber,
    Preview: TimePreview,
  },
  {
    n: "3",
    title: "Meet online",
    line: "Private video. Nothing to download.",
    region: REGIONS.mint,
    Preview: MeetPreview,
  },
];

export default function HowItWorks() {
  const reduced = useReducedMotion();
  const animate = !reduced;

  return (
    <section className="section">
      <div className="wrap-wide">
        <SectionHeading
          eyebrow="how it works"
          deva="मन"
          title="Three steps. Under five minutes."
        />

        <div className="relative grid gap-5 md:grid-cols-3 md:gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              className="relative"
              initial={animate ? { opacity: 0, y: 30 } : false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.7, delay: i * 0.15, ease: EASE }}
            >
              {/* arrow to the next step, drawn after this card lands */}
              {i < steps.length - 1 && (
                <svg
                  className="absolute -right-[1.1rem] top-1/2 z-10 hidden -translate-y-1/2 md:block"
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  aria-hidden="true"
                >
                  <motion.path
                    d="M3 11h15M13 6l5 5-5 5"
                    stroke="#C8A45D"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={animate ? { pathLength: 0 } : false}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true, margin: "-10% 0px" }}
                    transition={{ delay: animate ? 0.9 + i * 0.3 : 0, duration: 0.6, ease: EASE }}
                  />
                </svg>
              )}

              <div
                className="group flex h-full flex-col rounded-3xl border p-5 transition-shadow duration-500 ease-silk hover:shadow-lift md:p-6"
                style={{ backgroundColor: tint(step.region, 0.07), borderColor: tint(step.region, 0.2) }}
              >
                <div className="flex flex-1 flex-col justify-center md:min-h-[13rem] transition-transform duration-500 ease-silk group-hover:-translate-y-0.5">
                  <step.Preview animate={animate} region={step.region} />
                </div>

                <div className="mt-5 flex items-start gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-base font-medium text-ivory"
                    style={{ backgroundColor: ink(step.region) }}
                  >
                    {step.n}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-medium leading-tight text-forest-900 md:text-2xl">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-[0.92rem] text-ink/60">{step.line}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button href="/book" variant="gold">
            Book your first session
          </Button>
        </div>
      </div>
    </section>
  );
}
