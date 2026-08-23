"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Reveal from "@/components/ui/Reveal";

const values = [
  {
    title: "Confidential, always",
    body: "Not family, not employers, not insurance. Encrypted, and stored in India.",
    c: "#0E9FA6",
    ink: "#076166",
  },
  {
    title: "In your language",
    body: "Feelings don't always arrive in English. Switch mid-sentence; your therapist follows.",
    c: "#E14D7C",
    ink: "#A82454",
  },
  {
    title: "Priced for real life",
    body: "From ₹599, transparent fees, no subscription traps.",
    c: "#F0B429",
    ink: "#8A5A00",
  },
  {
    title: "Built for India",
    body: "Board exams, rishta calls, joint families, 11 p.m. work calls — no context needed.",
    c: "#4356CE",
    ink: "#2C3A9B",
  },
];

export default function WhyMannMatters() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yA = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const yB = useTransform(scrollYProgress, [0, 1], [-30, 30]);
  const yC = useTransform(scrollYProgress, [0, 1], [60, -20]);

  return (
    <section className="section relative overflow-hidden" ref={ref}>
      <div className="mesh-warm pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />

      <div className="wrap-wide relative grid items-center gap-14 lg:grid-cols-2">
        {/* a three-photo collage on gentle parallax, each frame in a
            different colour so the stack reads as one composition */}
        <div className="relative mx-auto h-[400px] w-full max-w-sm lg:h-[470px] lg:max-w-md">
          <motion.div
            style={{ y: yA }}
            className="absolute left-0 top-0 w-[70%] overflow-hidden rounded-2xl border-4 border-haldi/60 shadow-bloom"
          >
            <Image
              src="https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=900&q=80"
              alt="A person sitting peacefully in soft morning light, eyes closed"
              width={720}
              height={900}
              className="h-auto w-full object-cover"
              sizes="(max-width: 1024px) 70vw, 30vw"
            />
          </motion.div>

          <motion.div
            style={{ y: yB }}
            className="absolute bottom-6 right-0 w-[56%] overflow-hidden rounded-2xl border-4 border-gulaal/50 shadow-bloom"
          >
            <Image
              src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=700&q=80"
              alt="Someone meditating cross-legged as the sun rises behind the palms"
              width={560}
              height={700}
              className="h-auto w-full object-cover"
              sizes="(max-width: 1024px) 50vw, 22vw"
            />
          </motion.div>

          <motion.div
            style={{ y: yC }}
            className="absolute -top-4 right-2 hidden w-[34%] overflow-hidden rounded-xl border-4 border-mor/50 shadow-bloom sm:block"
          >
            <Image
              src="https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?auto=format&fit=crop&w=500&q=80"
              alt="Hands resting a singing bowl beside a curl of incense smoke"
              width={500}
              height={340}
              className="h-auto w-full object-cover"
              sizes="(max-width: 1024px) 30vw, 14vw"
            />
          </motion.div>

          {/* floating glass stat card — echo of the hero's 3D language */}
          <motion.div
            style={{ y: yB }}
            className="absolute -left-2 bottom-12 rounded-2xl border border-white/50 bg-white/60 px-5 py-3.5 shadow-glass backdrop-blur-xl"
          >
            <p className="text-sunrise font-display text-3xl font-medium">93%</p>
            <p className="text-xs tracking-wide text-ink/60">
              feel better within
              <br />5 sessions
            </p>
          </motion.div>
        </div>

        <div>
          <Reveal from="right">
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="font-deva text-sm normal-case tracking-normal text-kesar" aria-hidden="true">
                मन
              </span>
              why mann matters
            </p>
            <h2 className="h-display text-4xl md:text-5xl">
              Therapy without the{" "}
              <em className="text-dusk italic">&ldquo;log kya kahenge&rdquo;</em>
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {values.map((v, i) => (
              <Reveal key={v.title} from="right" delay={0.08 * i}>
                <span
                  className="block h-1 w-12 rounded-full"
                  style={{ background: `linear-gradient(90deg, ${v.c}, ${v.c}33)` }}
                  aria-hidden="true"
                />
                <h3
                  className="mt-4 font-display text-lg font-medium"
                  style={{ color: v.ink }}
                >
                  {v.title}
                </h3>
                <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink/70">{v.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
