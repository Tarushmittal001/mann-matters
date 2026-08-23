"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";

/* Each step carries a photograph under a duotone wash, so the three images
   read as one set rather than three unrelated stock pictures — and the
   wash walks along the palette as you go. */
const steps = [
  {
    n: "01",
    title: "Choose your expert",
    body: "Browse psychologists by concern, language, and budget. Read how they work. Pick the one who feels right — you can always switch.",
    c: "#F0B429",
    ink: "#8A5A00",
    wash: "linear-gradient(135deg,#F0B429,#E36A3B)",
    img: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=900&q=80",
    alt: "Five friends sitting together on a low wall, laughing",
  },
  {
    n: "02",
    title: "Pick a time",
    body: "Mornings before class, evenings after standup, weekends. Slots run 8 a.m. to 9 p.m., and rescheduling is free with a day's notice.",
    c: "#E14D7C",
    ink: "#A82454",
    wash: "linear-gradient(135deg,#E14D7C,#7C4D9B)",
    img: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80",
    alt: "A laptop, notebook and cup of coffee on a wooden desk by a window",
  },
  {
    n: "03",
    title: "Meet online",
    body: "A private video room opens on any phone or laptop — nothing to download. Just you, your therapist, and fifty unhurried minutes.",
    c: "#0E9FA6",
    ink: "#076166",
    wash: "linear-gradient(135deg,#0E9FA6,#4356CE)",
    img: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=900&q=80",
    alt: "Four people talking over a laptop at a café table",
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
    <section className="section relative overflow-hidden">
      <div className="mesh-warm pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

      <div className="wrap-wide relative">
        <SectionHeading
          eyebrow="how it works"
          deva="मन"
          title="Three small steps. One good decision."
          description="Booking therapy shouldn't feel harder than the thing you're booking it for. From first click to first session, most people take under five minutes."
        />

        <div ref={ref} className="relative">
          {/* connecting thread, drawn as you scroll, in the full spectrum */}
          <svg
            className="absolute -top-2 left-0 hidden h-24 w-full md:block"
            viewBox="0 0 1200 100"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="hiw-thread" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#F0B429" />
                <stop offset="35%" stopColor="#E36A3B" />
                <stop offset="65%" stopColor="#E14D7C" />
                <stop offset="100%" stopColor="#0E9FA6" />
              </linearGradient>
            </defs>
            <motion.path
              d="M 70 62 C 240 18, 420 92, 600 54 C 780 18, 960 90, 1130 50"
              stroke="url(#hiw-thread)"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ pathLength }}
            />
          </svg>

          <div className="grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.15}>
                <div className="group relative pt-2 md:pt-28">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full border-2 bg-ivory font-display text-lg font-medium transition-transform duration-500 ease-silk group-hover:scale-110 md:absolute md:left-0 md:top-6"
                    style={{
                      borderColor: step.c,
                      color: step.ink,
                      boxShadow: `0 10px 24px -12px ${step.c}`,
                    }}
                  >
                    {step.n}
                  </span>

                  <div
                    className="duotone relative mt-6 overflow-hidden rounded-2xl shadow-lift md:mt-0"
                    style={{ ["--wash" as string]: step.wash }}
                  >
                    <Image
                      src={step.img}
                      alt={step.alt}
                      width={900}
                      height={640}
                      className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-silk group-hover:scale-[1.06]"
                      sizes="(max-width: 768px) 90vw, 30vw"
                    />
                    <span
                      className="absolute inset-x-0 bottom-0 z-[3] h-1"
                      style={{ background: step.wash }}
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="mt-5 font-display text-2xl font-medium text-forest-900">
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
