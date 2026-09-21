"use client";

import Image from "next/image";
import { Caveat } from "next/font/google";
import { motion, useReducedMotion } from "framer-motion";
import Reveal from "@/components/ui/Reveal";

/*
 * Made to feel handmade rather than rendered: two real photographs printed as
 * polaroids, one taped down, a pen note that scribbles out "log kya kahenge?"
 * and answers it, and the 93% circled by hand. The reasons are a plain
 * numbered list, like a page in a notebook, not a grid of icon cards.
 *
 * Motion is small and happens once: the prints settle onto the page, the pen
 * strokes draw themselves. Hovering a print straightens it. With reduced
 * motion everything is simply there.
 */

const hand = Caveat({ subsets: ["latin"], weight: ["500", "700"], display: "swap" });

const EASE = [0.22, 1, 0.36, 1] as const;
const INK = "#1A5A4D"; // pen colour: the site's forest
const RED = "#B5474F"; // the scribble

const reasons = [
  { title: "Confidential, always", line: "Not family, not employers, not insurance. Encrypted, and stored in India." },
  { title: "In your language", line: "Feelings don't always arrive in English. Switch mid-sentence; your therapist follows." },
  { title: "Priced for real life", line: "From ₹599. Clear fees, no subscription traps." },
  { title: "Built for India", line: "Board exams, rishta calls, joint families, 11 p.m. work calls. No context needed." },
];

/** A pen stroke that draws itself once, when it scrolls into view. */
function Stroke({
  d,
  color = INK,
  width = 2.2,
  delay = 0,
  duration = 0.8,
}: {
  d: string;
  color?: string;
  width?: number;
  delay?: number;
  duration?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.path
      d={d}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      // opacity too: a zero-length round-capped stroke still shows as a dot
      initial={reduced ? false : { pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      // only the bottom edge is trimmed, so a note near the top of a phone screen still draws
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
      transition={{ duration, delay, ease: "easeInOut", opacity: { duration: 0.01, delay } }}
    />
  );
}

/** A photograph printed as a polaroid, with a handwritten caption. */
function Print({
  src,
  alt,
  caption,
  rotate,
  className,
  delay,
  tape,
}: {
  src: string;
  alt: string;
  caption: string;
  rotate: number;
  className: string;
  delay: number;
  tape?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.figure
      className={`absolute bg-[#FDFBF6] p-2 pb-0 shadow-[0_18px_40px_-18px_rgba(14,59,51,0.45)] sm:p-2.5 sm:pb-0 ${className}`}
      initial={reduced ? false : { opacity: 0, y: 24, rotate: rotate * 2.2 }}
      whileInView={{ opacity: 1, y: 0, rotate }}
      whileHover={reduced ? undefined : { rotate: 0, scale: 1.02 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {tape && (
        <span
          aria-hidden="true"
          className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 -rotate-3 bg-[#E8DDC2]/80 shadow-sm"
          style={{ clipPath: "polygon(3% 0, 97% 4%, 100% 100%, 0 96%)" }}
        />
      )}
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 1024px) 60vw, 26vw" />
      </div>
      <figcaption className={`${hand.className} px-1 py-1.5 text-center text-[1.05rem] leading-tight text-ink/75 sm:py-2 sm:text-[1.2rem]`}>
        {caption}
      </figcaption>
    </motion.figure>
  );
}

function Collage() {
  return (
    <div className="relative mx-auto h-[470px] w-full max-w-[30rem] sm:h-[560px]">
      <Print
        src="https://images.unsplash.com/photo-1603214982731-6d7fa94d6742?auto=format&fit=crop&w=900&q=80"
        alt="A woman sitting by a window in a plant-filled room, looking out"
        caption="an hour that's just mine"
        rotate={-3}
        delay={0}
        className="left-0 top-4 w-[57%]"
      />
      <Print
        src="https://images.unsplash.com/photo-1604881989793-466aca8dd319?auto=format&fit=crop&w=800&q=80"
        alt="Two people talking across a table with cups of coffee, hands resting between them"
        caption="tuesday, 7 p.m."
        rotate={4}
        delay={0.2}
        tape
        className="bottom-3 right-0 w-[47%]"
      />

      {/* pen note: the question, scribbled out, and the answer */}
      <div className={`${hand.className} absolute right-0 top-2 w-[40%] text-right`}>
        <div className="relative inline-block">
          <p className="whitespace-nowrap text-[1.2rem] leading-none text-ink/70 sm:text-[1.5rem]">log kya kahenge?</p>
          <svg className="absolute -left-1 top-1/2 h-5 w-[108%] -translate-y-1/2 overflow-visible" viewBox="0 0 160 20" preserveAspectRatio="none" aria-hidden="true">
            <Stroke d="M2 12 C 30 4, 50 16, 80 9 S 130 3, 158 11 M6 15 C 40 8, 90 17, 154 6" color={RED} width={2.4} delay={0.6} duration={0.9} />
          </svg>
        </div>
        <svg className="ml-auto mt-1 block h-10 w-16 overflow-visible" viewBox="0 0 64 40" aria-hidden="true">
          <Stroke d="M52 2 C 56 16, 44 30, 18 34" delay={1.4} duration={0.5} />
          <Stroke d="M26 27 L 17 34 L 27 39" delay={1.8} duration={0.3} />
        </svg>
        <motion.p
          className="-mt-1 text-[1.3rem] font-bold leading-tight sm:text-[1.6rem]"
          style={{ color: INK }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "0px 0px -15% 0px" }}
          transition={{ delay: 2, duration: 0.6 }}
        >
          yeh sirf mera hai.
        </motion.p>
      </div>

      {/* the number, circled in pen */}
      <div className={`${hand.className} absolute bottom-1 left-2 w-[48%]`}>
        <div className="relative inline-block px-3">
          <span className="text-[2.3rem] font-bold leading-none sm:text-[2.8rem]" style={{ color: INK }}>
            93%
          </span>
          <svg className="absolute -inset-x-1 -inset-y-2 h-[calc(100%+1rem)] w-[calc(100%+0.5rem)] overflow-visible" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
            <Stroke d="M60 6 C 20 2, 2 18, 6 34 C 10 54, 70 60, 92 40 C 104 24, 86 4, 50 7" color="#C8A45D" width={2} delay={1} duration={1} />
          </svg>
        </div>
        <p className="mt-1.5 text-[1.1rem] leading-tight text-ink/70 sm:text-[1.25rem]">feel better within 5 sessions</p>
      </div>
    </div>
  );
}

export default function WhyEmoraa() {
  return (
    <section className="section relative overflow-hidden">
      <div className="wrap-wide grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <Collage />

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

          <ol className="mt-10">
            {reasons.map((r, i) => (
              <li key={r.title} className="border-t border-forest-800/12 last:border-b">
                <Reveal from="right" delay={0.08 * i} className="grid grid-cols-[2.75rem_1fr] gap-x-3 py-5">
                  <span className="font-display text-2xl italic leading-none text-gold-dark">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-medium leading-tight text-forest-900">{r.title}</h3>
                    <p className="mt-1.5 max-w-md text-[0.95rem] leading-relaxed text-ink/65">{r.line}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
