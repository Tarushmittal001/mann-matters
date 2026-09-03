import type { Metadata } from "next";
import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import CountUp from "@/components/ui/CountUp";
import FloatingOrbs from "@/components/ui/FloatingOrbs";
import CTABand from "@/components/sections/CTABand";
import { cn } from "@/lib/utils";
import ChaiSteam from "@/components/visuals/ChaiSteam";

export const metadata: Metadata = {
  title: "About — Why we built Emoraa",
  description:
    "The story of Emoraa: why India needs therapy that speaks its languages, who we are, and the values we won't compromise on.",
};

const indiaStats = [
  { value: 197, suffix: "M+", label: "Indians live with a mental health condition" },
  { value: 0.75, suffix: "", decimals: 2, label: "psychiatrists per 100,000 people" },
  { value: 83, suffix: "%", label: "who need care never receive it" },
  { value: 14416, suffix: "", label: "Tele-MANAS — proof the tide is turning", plain: true },
];

const team = [
  {
    name: "Tarush Mittal",
    role: "Founder",
    note: "Left a decade in fintech after watching three colleagues burn out in one year.",
    photo: "/team/tarush-mittal.png",
  },
  {
    name: "Gaurav Mittal",
    role: "Director",
    note: "Keeps the practice steady — the operations, the partnerships, the promises we make to clients.",
    photo: "/team/gaurav-mittal.png",
  },
  {
    name: "Bhavya Nimesh",
    role: "Clinical Director",
    note: "Clinical psychologist, 16 years. Insists every therapist here would be one she'd send family to.",
    photo: "/team/bhavya-nimesh.png",
  },
  {
    name: "Ishaan Mittal",
    role: "CTO",
    note: "Builds the technology that makes good help reachable — privately, in any language, in minutes.",
    photo: "/team/ishaan-mittal.png",
  },
];

const values = [
  {
    title: "Confidentiality is sacred",
    body: "Not a feature, a foundation. We've turned down revenue rather than loosen it — and we always will.",
  },
  {
    title: "Language is care",
    body: "Therapy in the language you dream in. Two and counting, because feelings shouldn't need subtitles.",
  },
  {
    title: "Evidence over trends",
    body: "Our therapists practice approaches with research behind them. No crystals, no cold plunges sold as cures.",
  },
  {
    title: "Priced like we mean it",
    body: "If a student can't afford the first session, the price is wrong. ₹599 isn't a promotion; it's the principle.",
  },
];

const timeline = [
  {
    year: "2022",
    title: "A kitchen-table question",
    body: "After a friend waited four months for an affordable therapist, Tarush asked: why is good help this hard to reach in a country of 1.4 billion?",
  },
  {
    year: "2023",
    title: "Eight therapists, one promise",
    body: "Emoraa launches in Noida with eight hand-picked psychologists and a rule that still stands: every credential verified, every session confidential.",
  },
  {
    year: "2024",
    title: "2+ languages, student pricing",
    body: "Sessions go live in 2+ languages. The ₹599 student rate launches during board season — our busiest fortnight ever, overnight.",
  },
  {
    year: "2025",
    title: "Workplaces join in",
    body: "Corporate programs begin, built on anonymity-first reporting. The 10,000th session is delivered in November — in Malayalam, at 9 p.m., to a first-time client.",
  },
  {
    year: "2026",
    title: "Sixty therapists and counting",
    body: "A growing practice across every metro and most of small-town India — because the next person who needs us probably isn't in a metro at all.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* mission */}
      <section className="page-top relative overflow-hidden pb-20 md:pb-28">
      {/* steam off a chai glass — click to pour another */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] md:block"
        aria-hidden="true"
      >
        <div
          className="pointer-events-auto h-full w-full opacity-[0.95]"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 32%, black 100%)",
            maskImage:
              "linear-gradient(to right, transparent 0%, black 32%, black 100%)",
          }}
        >
          <ChaiSteam />
        </div>
      </div>
      {/* scrim keeps the headline legible where it meets the canvas */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden w-[58%] md:block"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, #F7F4EE 0%, #F7F4EE 40%, #F7F4EEd9 62%, #F7F4EE00 100%)",
        }}
      />
        <FloatingOrbs />
        <div className="wrap-wide pointer-events-none relative z-10">
          <Reveal>
            <p className="eyebrow mb-5 flex items-center gap-3">
              <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
              our story
            </p>
            <h1 className="h-display max-w-5xl text-[clamp(2.6rem,6vw,5.5rem)]">
              We exist so that asking for help feels as ordinary as{" "}
              <em className="text-forest-600">asking for chai.</em>
            </h1>
          </Reveal>
        </div>
      </section>

      {/* founder note */}
      <section className="section bg-sage-light/30">
        <div className="wrap grid items-start gap-12 lg:grid-cols-5">
          <Reveal className="lg:col-span-2">
            <div className="overflow-hidden rounded-3xl shadow-bloom">
              <Image
                src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80"
                alt="The Emoraa team working together at a sunlit table"
                width={900}
                height={1100}
                className="aspect-[4/5] w-full object-cover"
                sizes="(max-width: 1024px) 92vw, 36vw"
              />
            </div>
          </Reveal>
          <Reveal delay={0.12} className="lg:col-span-3">
            <p className="eyebrow mb-6">a note from the founder</p>
            <div className="space-y-6 font-display text-[1.45rem] font-medium leading-relaxed text-forest-900 md:text-[1.7rem]">
              <p>
                &ldquo;We didn&apos;t start Emoraa because therapy was missing in
                India. It wasn&apos;t — there are brilliant psychologists here. What
                was missing was a way to reach them that didn&apos;t require money,
                English, and the courage to walk past a waiting room.
              </p>
              <p>
                So we built the version we wished our younger selves had found:
                online, in your own language, at a price that doesn&apos;t need
                hiding from your parents — or your manager.&rdquo;
              </p>
            </div>
            <p className="mt-8 text-sm text-ink/60">
              — Tarush Mittal, founder
            </p>
          </Reveal>
        </div>
      </section>

      {/* why India needs this */}
      <section className="section">
        <div className="wrap-wide">
          <Reveal className="max-w-2xl">
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
              why india, why now
            </p>
            <h2 className="h-display text-4xl md:text-5xl">The numbers we&apos;re working against</h2>
            <p className="mt-6 text-lg text-ink/70">
              Behind every statistic is someone who decided not to ask. Each of these is a reason this work can&apos;t wait.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {indiaStats.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.1}>
                <div className="h-full rounded-2xl border border-forest-800/10 bg-ivory-light p-7 shadow-lift">
                  <p className="font-display text-4xl font-medium text-forest-900 md:text-5xl">
                    {s.plain ? (
                      <span>{s.value}</span>
                    ) : (
                      <CountUp value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
                    )}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink/65">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* team */}
      <section className="section bg-sage-light/30">
        <div className="wrap-wide">
          <Reveal className="max-w-2xl">
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
              the people
            </p>
            <h2 className="h-display text-4xl md:text-5xl">The minds behind Emoraa</h2>
          </Reveal>
          <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m, i) => (
              <Reveal key={m.name} delay={(i % 3) * 0.1}>
                <div className="group">
                  <div className="overflow-hidden rounded-2xl">
                    <Image
                      src={m.photo}
                      alt={`Portrait of ${m.name}`}
                      width={600}
                      height={700}
                      className="aspect-[6/7] w-full object-cover transition-transform duration-700 ease-silk group-hover:scale-[1.04]"
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
                    />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-medium text-forest-900">{m.name}</h3>
                  <p className="mt-0.5 text-sm font-medium text-gold-dark">{m.role}</p>
                  <p className="mt-2.5 text-[0.93rem] leading-relaxed text-ink/65">{m.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* values */}
      <section className="section">
        <div className="wrap-wide grid gap-14 lg:grid-cols-5">
          <Reveal className="lg:col-span-2">
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
              what we won&apos;t compromise
            </p>
            <h2 className="h-display text-4xl md:text-5xl">Four things we&apos;d rather close than break</h2>
          </Reveal>
          <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:col-span-3">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08}>
                <span className="gold-rule" aria-hidden="true" />
                <h3 className="mt-5 font-display text-2xl font-medium text-forest-900">{v.title}</h3>
                <p className="mt-3 leading-relaxed text-ink/70">{v.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* timeline */}
      <section className="section bg-forest-900 text-ivory">
        <div className="wrap">
          <Reveal className="max-w-2xl">
            <p className="eyebrow mb-4 text-sage">
              <span className="font-deva normal-case tracking-normal text-gold" aria-hidden="true">मन</span> the journey
            </p>
            <h2 className="h-display text-4xl text-ivory md:text-5xl">Small steps, taken steadily</h2>
          </Reveal>

          <div className="relative mt-16 space-y-14 border-l border-ivory/15 pl-8 md:pl-12">
            {timeline.map((t, i) => (
              <Reveal key={t.year} delay={i * 0.08}>
                <div className={cn("relative")}>
                  <span className="absolute -left-[37px] top-2 h-2.5 w-2.5 rounded-full bg-gold md:-left-[53px]" aria-hidden="true" />
                  <p className="font-display text-3xl font-medium text-gold">{t.year}</p>
                  <h3 className="mt-2 font-display text-xl font-medium text-ivory">{t.title}</h3>
                  <p className="mt-2.5 max-w-xl leading-relaxed text-sage-light/75">{t.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}
