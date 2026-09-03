"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Reveal from "@/components/ui/Reveal";

const values = [
  {
    title: "Confidential, always",
    body: "Not family, not employers, not insurance. Encrypted, and stored in India.",
  },
  {
    title: "In your language",
    body: "Feelings don't always arrive in English. Switch mid-sentence; your therapist follows.",
  },
  {
    title: "Priced for real life",
    body: "From ₹599, transparent fees, no subscription traps.",
  },
  {
    title: "Built for India",
    body: "Board exams, rishta calls, joint families, 11 p.m. work calls — no context needed.",
  },
];

export default function WhyEmoraa() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yA = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const yB = useTransform(scrollYProgress, [0, 1], [-30, 30]);

  return (
    <section className="section relative overflow-hidden" ref={ref}>
      <div className="wrap-wide grid items-center gap-14 lg:grid-cols-2">
        {/* layered imagery with gentle parallax */}
        <div className="relative mx-auto h-[380px] w-full max-w-sm lg:h-[440px] lg:max-w-md">
          <motion.div style={{ y: yA }} className="absolute left-0 top-0 w-[72%] overflow-hidden rounded-2xl shadow-bloom">
            <Image
              src="https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=900&q=80"
              alt="A person sitting peacefully in soft morning light, eyes closed"
              width={720}
              height={900}
              className="h-auto w-full object-cover"
              sizes="(max-width: 1024px) 70vw, 30vw"
            />
          </motion.div>
          <motion.div style={{ y: yB }} className="absolute bottom-4 right-0 w-[55%] overflow-hidden rounded-2xl border-4 border-ivory shadow-bloom">
            <Image
              src="https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=700&q=80"
              alt="A woman relaxing with a warm drink by a window"
              width={560}
              height={700}
              className="h-auto w-full object-cover"
              sizes="(max-width: 1024px) 50vw, 22vw"
            />
          </motion.div>
          {/* floating glass stat card — echo of the hero's 3D language */}
          <motion.div
            style={{ y: yB }}
            className="absolute -left-2 bottom-10 rounded-2xl border border-white/40 bg-white/55 px-5 py-3.5 shadow-glass backdrop-blur-xl"
          >
            <p className="font-display text-3xl font-medium text-forest-900">93%</p>
            <p className="text-xs tracking-wide text-ink/60">
              feel better within
              <br />5 sessions
            </p>
          </motion.div>
        </div>

        <div>
          <Reveal from="right">
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
              why Emoraa
            </p>
            <h2 className="h-display text-4xl md:text-5xl">
              Therapy without the <em className="text-forest-600">&ldquo;log kya kahenge&rdquo;</em>
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {values.map((v, i) => (
              <Reveal key={v.title} from="right" delay={0.08 * i}>
                <span className="gold-rule block" aria-hidden="true" />
                <h3 className="mt-4 font-display text-lg font-medium text-forest-900">{v.title}</h3>
                <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink/70">{v.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
