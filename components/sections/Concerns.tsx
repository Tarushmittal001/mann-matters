"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import { REGIONS, type Region } from "@/lib/palette";

/**
 * "What brings you here?" — the eight things people actually arrive with.
 *
 * ── WHERE THIS CAME FROM ───────────────────────────────────────────────────
 * These eight words used to orbit the neural brain in the hero, joined to
 * points on a silhouette. However they were drawn — solid leaders, dotted
 * trails, nothing at all — a word tied to a spot on a specimen is a labelled
 * anatomical figure, and that is the most clinical thing a mental-health site
 * can open with. They were also eight pieces of body-size text competing with
 * the one sentence the hero exists to deliver.
 *
 * So they moved here and became what they always were: eight doors. Each one
 * is a real link to the service that handles it, which is what they were
 * doing on the brain too — only now it looks like something you can click.
 *
 * ── THE SECOND LINE IS THE POINT ───────────────────────────────────────────
 * "Anxiety" is a clinical word. "worry that won't stop" is what a person
 * actually types at 1 a.m. The small line underneath is not decoration; it is
 * the translation, and it is the difference between a taxonomy and a hand up.
 * Four of these were already written for the brain; the other four are in the
 * same voice. "log kya kahenge" is deliberate — it is the exact phrase the
 * WhyEmoraa section answers further down the page.
 *
 * ── COLOUR ─────────────────────────────────────────────────────────────────
 * The eight brain-region colours, which `lib/palette.ts` already maps to
 * services. Six take the colour of the service they link to. Two do not, and
 * say so below: Anxiety and Low mood both lead to individual therapy, and two
 * identical cards in one grid looks like a bug rather than a fact, so Low
 * mood takes the brain stem (breath, calm, feeling safe) and Can't sleep
 * takes the temporal lobe, since the prefrontal colour is already spoken for
 * by Career worry. The colours still mean what the palette says they mean.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const tint = (r: Region, a: number) => `rgba(${r.rgb[0]},${r.rgb[1]},${r.rgb[2]},${a})`;
// brand gold is too pale for small text on cream
const ink = (r: Region) => (r.id === "amber" ? "#A98943" : r.hex);

type Concern = {
  label: string;
  /** What it feels like, in the words someone would actually use. */
  also: string;
  href: string;
  region: Region;
};

const CONCERNS: Concern[] = [
  { label: "Anxiety",         also: "worry that won't stop",  href: "/services/individual-therapy",    region: REGIONS.teal },
  { label: "Low mood",        also: "heavy, most days",       href: "/services/individual-therapy",    region: REGIONS.mint },
  { label: "Exam stress",     also: "the week before",        href: "/services/student-support",       region: REGIONS.indigo },
  { label: "Family pressure", also: "log kya kahenge",        href: "/services/family-therapy",        region: REGIONS.plum },
  { label: "Love life",       also: "it keeps hurting",       href: "/services/love-life-counselling", region: REGIONS.rose },
  { label: "Career worry",    also: "is this the right path?",href: "/services/career-counselling",    region: REGIONS.violet },
  { label: "Burnout",         also: "running on empty",       href: "/services/daily-life-stress",     region: REGIONS.moss },
  { label: "Can't sleep",     also: "awake at 2 a.m.",        href: "/services/sleep-programme",       region: REGIONS.amber },
];

export default function Concerns() {
  return (
    <section className="section">
      <div className="wrap-wide">
        <SectionHeading
          eyebrow="what brings you here"
          deva="मन"
          title="Start wherever it hurts."
        />

        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {CONCERNS.map((c, i) => (
            <motion.li
              key={c.label}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              /* staggered by column, not by index: on a 4-up grid the second
                 row should not wait for the first row to finish */
              transition={{ duration: 0.6, delay: (i % 4) * 0.07, ease: EASE }}
            >
              <Link
                href={c.href}
                className="card-mm group flex h-full flex-col justify-between gap-6 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:p-6"
                style={{ backgroundColor: tint(c.region, 0.07), borderColor: tint(c.region, 0.18) }}
              >
                {/*
                  A single dot in the region's colour, which grows a soft ring
                  on hover — the one piece of the brain worth keeping. It is a
                  mark, not a diagram: nothing points anywhere and nothing is
                  being labelled.
                */}
                <span className="relative flex h-3 w-3" aria-hidden="true">
                  <span
                    className="absolute inset-0 rounded-full opacity-0 transition-all duration-500 ease-silk group-hover:-inset-2 group-hover:opacity-100"
                    style={{ backgroundColor: tint(c.region, 0.22) }}
                  />
                  <span
                    className="relative h-3 w-3 rounded-full"
                    style={{ backgroundColor: ink(c.region) }}
                  />
                </span>

                <span>
                  <span className="block font-display text-xl font-medium leading-tight text-forest-900 sm:text-2xl">
                    {c.label}
                  </span>
                  <span className="mt-1.5 block text-[0.88rem] leading-snug text-ink/60">
                    {c.also}
                  </span>
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>

        <p className="mt-8 text-center text-[0.95rem] text-ink/60">
          Not on the list?{" "}
          <Link href="/services" className="link-draw font-medium text-forest-700">
            Everything we work with
          </Link>
        </p>
      </div>
    </section>
  );
}
