import type { Metadata } from "next";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import FloatingOrbs from "@/components/ui/FloatingOrbs";
import SectionHeading from "@/components/ui/SectionHeading";
import CTABand from "@/components/sections/CTABand";
import ServiceGrid from "@/components/services/ServiceGrid";
import SelfCheckCta from "@/components/services/SelfCheckCta";
import { listExperts } from "@/lib/experts-store";
import { sessionSteps, services } from "@/lib/services";
import { serviceAvailability } from "@/lib/service-catalogue";
import { CountWord, formatINR } from "@/lib/utils";
import TheRoom from "@/components/visuals/TheRoom";

export const metadata: Metadata = {
  title: "Services — Therapy, counselling & wellness programs",
  alternates: {
    canonical: "/services",
    languages: { "en-IN": "/services", "hi-IN": "/hi/services" },
  },
  description:
    "Psychiatry, individual therapy from ₹999, couples and family therapy, student, career and love-life counselling, LGBTQIA+ affirmative care, and group sessions from ₹399. Online and confidential.",
};

export default async function ServicesPage() {
  const experts = await listExperts();

  /**
   * The cheapest thing somebody can actually buy today.
   *
   * Read from what is *bookable*, not from the catalogue. This line used to be
   * computed from every listed price, which meant it quoted ₹399 for group
   * sessions while nobody was running any — a true statement about a table and
   * a false one about the world.
   */
  const rows = await serviceAvailability();
  // the floor of what practitioners actually charge, not the catalogue's
  // standard price — the two part company as soon as anyone sets their own
  const bookablePrices = rows
    .filter((r) => r.bookable && r.priceRange)
    .map((r) => ({ slug: r.service.slug, price: (r.priceRange as { min: number }).min }));
  const groupPrices = bookablePrices.filter((p) => p.slug === "group-sessions");
  const oneToOnePrices = bookablePrices.filter((p) => p.slug !== "group-sessions");
  const cheapestGroup = groupPrices.length ? Math.min(...groupPrices.map((p) => p.price)) : null;
  const cheapestOneToOne = oneToOnePrices.length
    ? Math.min(...oneToOnePrices.map((p) => p.price))
    : null;
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
              {CountWord(services.length)} kinds of support, one standard: a qualified
              professional, complete confidentiality, and a price you can actually sustain.
            </p>
            <div className="pointer-events-auto mt-10 flex flex-wrap items-center gap-4">
              <Button href="/book" variant="gold">
                Book a session
              </Button>
              <SelfCheckCta variant="outline" experts={experts}>Take the self-check</SelfCheckCta>
            </div>
            <p className="mt-6 text-sm text-ink/70">
              {/* Priced off the catalogue, not typed in. The old line said
                  "Fifty minutes, from ₹599" — but nothing that runs fifty
                  minutes costs ₹599, and a price claim that does not survive
                  a reader checking it is worse than no claim. */}
              {cheapestOneToOne !== null && <>One-to-one from {formatINR(cheapestOneToOne)}</>}
              {cheapestOneToOne !== null && cheapestGroup !== null && <>, groups from {formatINR(cheapestGroup)}</>}
              {cheapestOneToOne !== null && ". "}
              No diagnosis on day one, and no one else needs to know.
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
                every one of these is run by a certified psychologist, not a coach and
                not a chatbot. The single exception is the one the law requires, an
                immediate risk to your life or someone else&apos;s, and we would talk
                to you about it first.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── every format we run ──────────────────────────────────────────── */}
      <section className="section">
        <div className="wrap-wide">
          <SectionHeading
            eyebrow="what we offer"
            deva="मन"
            title={`${CountWord(services.length)} kinds of support, one standard`}
            description="They differ in who is in the room, how long it runs, and what it costs. They do not differ in who you get, or in how carefully you are looked after. Start anywhere. Your therapist will say if another one fits you better."
          />

          <ServiceGrid />

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

      <CTABand />
    </>
  );
}
