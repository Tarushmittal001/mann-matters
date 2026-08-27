"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";

const steps = [
  {
    n: "01",
    title: "Choose your expert",
    body: "Browse psychologists by concern, language, and budget. Read how they work. Pick the one who feels right — you can always switch.",
  },
  {
    n: "02",
    title: "Pick a time",
    body: "Mornings before class, evenings after standup, weekends. Slots run 8 a.m. to 9 p.m., and rescheduling is free with a day's notice.",
  },
  {
    n: "03",
    title: "Meet online",
    body: "A private video room opens on any phone or laptop — nothing to download. Just you, your therapist, and fifty unhurried minutes.",
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 80%"],
  });
  const pathLength = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });

  return (
    <section className="section">
      <div className="wrap-wide">
        <SectionHeading
          eyebrow="how it works"
          deva="मन"
          title="Three small steps. One good decision."
          description="Booking therapy shouldn't feel harder than the thing you're booking it for. From first click to first session, most people take under five minutes."
        />

        <div ref={ref} className="relative">
          {/* connecting thread, drawn as you scroll */}
          <svg
            className="absolute -top-2 left-0 hidden h-24 w-full md:block"
            viewBox="0 0 1200 100"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <motion.path
              d="M 70 62 C 240 18, 420 92, 600 54 C 780 18, 960 90, 1130 50"
              stroke="#C8A45D"
              strokeWidth="1.5"
              strokeDasharray="1 0"
              style={{ pathLength }}
            />
          </svg>

          <div className="grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.15}>
                <div className="relative pt-2 md:pt-28">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 bg-ivory font-display text-lg font-medium text-forest-800 md:absolute md:left-0 md:top-6">
                    {step.n}
                  </span>
                  <h3 className="mt-6 font-display text-2xl font-medium text-forest-900 md:mt-0">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-sm leading-relaxed text-ink/70">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
