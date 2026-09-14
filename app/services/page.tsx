import type { Metadata } from "next";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import FloatingOrbs from "@/components/ui/FloatingOrbs";
import SectionHeading from "@/components/ui/SectionHeading";
import CTABand from "@/components/sections/CTABand";
import ServiceGrid from "@/components/services/ServiceGrid";
import SelfCheckCta from "@/components/services/SelfCheckCta";
import { comparison, sessionSteps } from "@/lib/services";
import { therapyPages } from "@/lib/therapy-pages";
import { cn } from "@/lib/utils";
import TheRoom from "@/components/visuals/TheRoom";

export const metadata: Metadata = {
  title: "Services — Therapy, counselling & wellness programs",
  description:
    "Psychiatry, individual therapy from ₹999, couples and family therapy, student, career and love-life counselling, LGBTQIA+ affirmative care, and group sessions from ₹399. Online and confidential.",
};

function Check({ yes }: { yes: boolean }) {
  return yes ? (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="mx-auto text-gold" aria-hidden="true">
      <path d="M3.5 9.5 7 13l7.5-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <span className="text-ink/25" aria-hidden="true">—</span>
  );
}

export default function ServicesPage() {
  return (
    <>
      {/* manifesto hero */}
      <section className="page-top relative overflow-hidden pb-20 md:pb-28">
      {/* six chairs, rearranging into the room each format happens in — click a chair or a marker */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] md:block"
        aria-hidden="true"
      >
        <div
          className="pointer-events-auto h-full w-full opacity-[0.85]"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 34%, black 100%)",
            maskImage:
              "linear-gradient(to right, transparent 0%, black 34%, black 100%)",
          }}
        >
          <TheRoom />
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
              our services
            </p>
            <h1 className="h-display max-w-4xl text-5xl md:text-7xl">
              However it shows up,
              <br />
              <em className="text-forest-600">there&apos;s a way through.</em>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink/70">
              Ten kinds of support, one standard: a licensed professional,
              complete confidentiality, and a price you can actually sustain.
            </p>
            <div className="pointer-events-auto mt-10 flex flex-wrap items-center gap-4">
              <Button href="/book" variant="gold">
                Book a session
              </Button>
              <Button href="/match" variant="outline">
                Not sure which? Take two minutes
              </Button>
            </div>
            <p className="mt-6 text-sm text-ink/50">
              Fifty minutes, from &#8377;599. No diagnosis on day one, and no one
              else needs to know.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── the promise everything else rests on ─────────────────── */}
      <section className="border-y border-forest-800/10 bg-ivory-dark/60 py-10">
        <div className="wrap-wide">
          <Reveal>
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="shrink-0 text-gold-dark"
                aria-hidden="true"
              >
                <path d="M12 2.8 4.5 6v6.2c0 4.4 3.1 7.9 7.5 9 4.4-1.1 7.5-4.6 7.5-9V6L12 2.8Z" strokeLinejoin="round" />
                <path d="M9 12.2l2.2 2.2L15.5 10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="max-w-4xl leading-relaxed text-ink/75">
                <strong className="font-semibold text-forest-900">
                  Whatever format you pick, nothing you say in a session leaves it.
                </strong>{" "}
                Not to your family, not to your employer, not to your college — and
                every one of these is run by a licensed psychologist, not a coach and
                not a chatbot. The single exception is the one the law requires, an
                immediate risk to your life or someone else&apos;s, and we would talk
                to you about it first.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── the ten kinds of support ─────────────────────────────────────── */}
      <section className="section">
        <div className="wrap-wide">
          <SectionHeading
            eyebrow="what we offer"
            deva="मन"
            title="Ten kinds of support, one standard"
            description="They differ in who is in the room, how long it runs, and what it costs — not in who you get or how carefully you are held. Start anywhere; your therapist will say if another one fits better."
          />

          <ServiceGrid />

          {/* ten options is a lot to choose between when you are not well — this
              is the way through for anyone who scrolled and felt worse */}
          <Reveal>
            <div className="mt-12 flex flex-col gap-6 rounded-2xl border border-forest-800/12 bg-forest-950 p-8 text-ivory sm:flex-row sm:items-center sm:justify-between md:mt-14 md:px-10">
              <div className="max-w-xl">
                <p className="eyebrow flex items-center gap-3 text-sage">
                  <span className="font-deva normal-case tracking-normal text-gold" aria-hidden="true">
                    मन
                  </span>
                  not sure which
                </p>
                <h3 className="mt-3 font-display text-2xl font-medium leading-snug text-ivory md:text-[1.7rem]">
                  Let the answers pick for you.
                </h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-sage-light/75">
                  Nineteen questions from the same three screeners a psychologist
                  would use. You get a percentage for worry, mood and load, one
                  service to start with, and two therapists who work on it. Nothing
                  is sent anywhere — the answers never leave your device.
                </p>
              </div>
              <SelfCheckCta className="shrink-0">Take the self-check</SelfCheckCta>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section bg-forest-950 text-ivory">
        <div className="wrap-wide grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeading
            eyebrow="care that meets you there"
            deva="मन"
            title="Find therapy by place or language."
            description="Sessions are online across India. These guides help you find the practical and cultural fit that makes starting easier."
            dark
          />
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {(["city", "language"] as const).map((kind) => (
              <Reveal key={kind}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                    {kind === "city" ? "By city" : "By language"}
                  </p>
                  <div className="mt-4 flex flex-col items-start gap-3">
                    {therapyPages.filter((page) => page.kind === kind).map((page) => (
                      <Link
                        key={page.slug}
                        href={`/therapy/${page.slug}`}
                        className="link-draw font-display text-xl font-medium text-sage-light hover:text-ivory"
                      >
                        {page.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── how it works ───────────────────────────── */}
      <section className="section">
        <div className="wrap-wide">
          <SectionHeading
            eyebrow="how it works"
            deva="मन"
            title="From here to your first session"
            description="Four steps, and you can stop at any of them. Nothing is charged until both a therapist and a time are actually held for you."
          />

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {sessionSteps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <div className="border-t border-forest-800/15 pt-6">
                  <span className="font-display text-3xl font-medium text-gold-dark/60">{s.n}</span>
                  <h3 className="mt-3 font-display text-xl font-medium text-forest-900">{s.title}</h3>
                  <p className="mt-2.5 text-[0.93rem] leading-relaxed text-ink/70">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* comparison table */}
      <section className="section bg-sage-light/30">
        <div className="wrap">
          <SectionHeading
            eyebrow="at a glance"
            deva="मन"
            title="Every format, side by side"
            description="The four core session formats, and only the differences that actually change your decision."
          />

          <Reveal delay={0.1}>
            <div className="overflow-x-auto rounded-3xl border border-forest-800/10 bg-ivory-light shadow-lift">
              <table className="w-full min-w-[640px] text-left text-[0.95rem]">
                <caption className="sr-only">Comparison of Emoraa session formats</caption>
                <thead>
                  <tr>
                    <th scope="col" className="px-7 py-6 font-medium text-ink/50">
                      What&apos;s included
                    </th>
                    {comparison.columns.map((c) => (
                      <th scope="col" key={c} className="px-5 py-6 text-center font-display text-lg font-medium text-forest-900">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.rows.map((row, i) => (
                    <tr key={row.label} className={cn(i % 2 === 0 && "bg-sage-light/20")}>
                      <th scope="row" className="px-7 py-4 font-normal text-ink/80">
                        {row.label}
                      </th>
                      {row.values.map((v, j) => (
                        <td key={j} className="px-5 py-4 text-center font-medium text-forest-800">
                          {typeof v === "boolean" ? <Check yes={v} /> : v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      <CTABand />
    </>
  );
}
