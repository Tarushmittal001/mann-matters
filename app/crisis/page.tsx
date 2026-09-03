import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import BreathingExercise from "@/components/tools/BreathingExercise";
import { helplines, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Crisis support — You're not alone",
  description:
    "Immediate mental-health crisis support for India. Tele-MANAS 14416, emergency 112, and verified 24x7 helplines. If you're in danger or thinking of harming yourself, help is available right now.",
};

const grounding = [
  { n: "5", sense: "things you can see", hint: "Look around and name them, slowly." },
  { n: "4", sense: "things you can feel", hint: "Your feet on the floor, the chair, your breath." },
  { n: "3", sense: "things you can hear", hint: "A fan, traffic, your own heartbeat." },
  { n: "2", sense: "things you can smell", hint: "Or two smells you like." },
  { n: "1", sense: "thing you can taste", hint: "Or one slow sip of water." },
];

export default function CrisisPage({
  searchParams,
}: {
  searchParams: { sos?: string };
}) {
  const sos = searchParams.sos === "true";

  return (
    <main className="bg-ivory">
      {/* Emergency hero */}
      <section className="page-top relative overflow-hidden border-b border-red-200/60 bg-gradient-to-b from-red-50 to-ivory pb-16">
        <div className="wrap-wide">
          <Reveal>
            {sos && (
              <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                SOS · Crisis support
              </span>
            )}
            <h1 className="h-display max-w-3xl text-4xl text-forest-900 md:text-6xl">
              You&apos;re not alone. Help is available{" "}
              <em className="text-red-600">right now.</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/75">
              If you&apos;re thinking about harming yourself, or you&apos;re scared for
              your safety, please reach out this minute. These lines are free,
              confidential, and answered by people trained to help.
            </p>
          </Reveal>

          {/* Primary, do-it-now actions */}
          <Reveal delay={0.1}>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              {helplines
                .filter((h) => h.primary)
                .map((h) => (
                  <a
                    key={h.dial}
                    href={`tel:${h.dial}`}
                    className="card-lift flex flex-1 items-center justify-between gap-4 rounded-2xl bg-red-600 px-6 py-5 text-white shadow-lift transition-colors hover:bg-red-700"
                  >
                    <span>
                      <span className="block text-xs font-medium uppercase tracking-[0.16em] text-white/70">
                        Call {h.name} · {h.hours}
                      </span>
                      <span className="mt-1 block font-display text-3xl font-semibold">
                        {h.number}
                      </span>
                    </span>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                      <path d="M6.6 10.8a13 13 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.3 1l-2.1 2.3Z" strokeLinejoin="round" />
                    </svg>
                  </a>
                ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* All helplines */}
      <section className="section">
        <div className="wrap-wide">
          <Reveal className="mb-12 max-w-2xl">
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
              someone to talk to
            </p>
            <h2 className="h-display text-3xl md:text-4xl">Helplines across India</h2>
            <p className="mt-4 text-ink/70">
              Tap any number to call. If one line is busy, please try another — keep
              reaching out until someone picks up.
            </p>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {helplines.map((h, i) => (
              <Reveal key={h.dial} delay={(i % 3) * 0.08}>
                <a
                  href={`tel:${h.dial}`}
                  className="card-lift flex h-full flex-col rounded-2xl border border-forest-800/10 bg-ivory-light p-6 shadow-lift"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-medium text-forest-900">{h.name}</h3>
                    <span className="rounded-full bg-sage-light/60 px-2.5 py-0.5 text-[0.68rem] font-medium uppercase tracking-wide text-forest-700">
                      {h.hours}
                    </span>
                  </div>
                  <p className="mt-2 flex-1 text-[0.9rem] leading-relaxed text-ink/65">{h.note}</p>
                  <span className="mt-4 inline-flex items-center gap-2 font-display text-2xl font-semibold text-red-600">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="M6.6 10.8a13 13 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.3 1l-2.1 2.3Z" strokeLinejoin="round" />
                    </svg>
                    {h.number}
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Grounding — something to do while you wait */}
      <section className="section bg-forest-950 text-ivory">
        <div className="wrap-wide grid gap-14 lg:grid-cols-[0.9fr_1fr] lg:gap-20">
          <Reveal>
            <p className="eyebrow mb-4 text-sage">while you reach out</p>
            <h2 className="h-display text-3xl text-ivory md:text-4xl">
              Let&apos;s get through the next minute together.
            </h2>
            <p className="mt-5 leading-relaxed text-sage-light/80">
              If the feelings are huge right now, try this grounding exercise. It
              won&apos;t fix everything — it just brings you back to this moment, so the
              next breath feels possible. Name, slowly, in your head or out loud:
            </p>
            <div className="mt-10">
              <BreathingExercise tone="dark" />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <ol className="space-y-3">
              {grounding.map((g) => (
                <li
                  key={g.n}
                  className="flex items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/15 font-display text-2xl font-medium text-gold-light">
                    {g.n}
                  </span>
                  <div>
                    <p className="font-display text-lg font-medium text-ivory">{g.sense}</p>
                    <p className="text-[0.88rem] text-sage-light/70">{g.hint}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* Handoff + honest disclaimer */}
      <section className="section">
        <div className="wrap text-center">
          <Reveal>
            <h2 className="h-display text-3xl md:text-4xl">When the immediate danger has passed</h2>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-ink/70">
              Crisis lines are for this moment. For the days after, talking regularly
              to a licensed psychologist helps the ground feel steadier. When
              you&apos;re ready — no rush — we&apos;re here.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link
                href="/book"
                className="rounded-full bg-gold px-7 py-3.5 text-[0.95rem] font-semibold text-forest-950 transition-colors duration-300 hover:bg-gold-dark"
              >
                Book a session
              </Link>
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-forest-800/25 px-7 py-3.5 text-[0.95rem] font-semibold text-forest-800 transition-colors duration-300 hover:border-forest-800 hover:bg-forest-800 hover:text-ivory"
              >
                Talk to us on WhatsApp
              </a>
            </div>
            <p className="mx-auto mt-10 max-w-lg text-sm leading-relaxed text-ink/55">
              Emoraa is not an emergency service. If life is in immediate
              danger, please call <a href="tel:112" className="font-semibold text-red-600 underline underline-offset-4">112</a> or go to your
              nearest hospital emergency room.
            </p>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
