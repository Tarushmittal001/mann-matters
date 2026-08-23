import type { Metadata } from "next";
import Link from "next/link";
import Accordion from "@/components/ui/Accordion";
import Button from "@/components/ui/Button";
import FloatingOrbs from "@/components/ui/FloatingOrbs";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { orgFaqs, pillars, segments, steps } from "@/lib/organisations";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "For schools, colleges & companies",
  description:
    "Mental-health programs for Indian institutions — play schools, schools, colleges, coaching institutes, companies and NGOs. RCI-licensed psychologists, WhatsApp-first access, gatekeeper training, and a crisis protocol in writing.",
};

const enquiry =
  "mailto:" +
  site.email +
  "?subject=" +
  encodeURIComponent("Program enquiry — [your institution]") +
  "&body=" +
  encodeURIComponent(
    "Institution:\nType (school / college / institute / company / NGO):\nApproximate headcount:\nWhat's prompting this:\nBest number to reach you on:"
  );

export default function ForOrganisationsPage() {
  return (
    <>
      {/* ── hero ─────────────────────────────────────────────────── */}
      <section className="page-top relative overflow-hidden pb-20 md:pb-28">
        <FloatingOrbs />
        <div className="wrap-wide relative z-10">
          <Reveal>
            <p className="eyebrow mb-5 flex items-center gap-3">
              <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">
                संस्था
              </span>
              for institutions
            </p>
            <h1 className="h-display max-w-4xl text-5xl md:text-7xl">
              One counsellor for
              <br />
              four thousand students.
              <br />
              <em className="text-forest-600">Let&apos;s fix the arithmetic.</em>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink/70">
              We build mental-health programs for Indian schools, campuses and
              workplaces — the licensed clinicians, the WhatsApp access young
              people will actually use, the training for the adults around them,
              and the crisis protocol you hope never to need.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button href={enquiry} external variant="gold">
                Start a conversation
              </Button>
              <Button href={site.whatsapp} external variant="outline">
                Ask on WhatsApp
              </Button>
            </div>
            <p className="mt-6 text-sm text-ink/50">
              Thirty minutes, no deck. Often we&apos;ll tell you the problem is smaller
              than you think.
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
                  You will never see what an individual says in session.
                </strong>{" "}
                Not a name, not a transcript, not a list of who booked. You get
                aggregate patterns and utilisation — nothing that could identify
                one student or one employee. A program that breaks this promise
                is a program nobody uses, and we would rather lose the contract.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── segments ─────────────────────────────────────────────── */}
      <section className="section">
        <div className="wrap-wide">
          <SectionHeading
            eyebrow="who we build for"
            deva="मन"
            title="Six kinds of room, six different problems"
            description="A play school and a UPSC coaching institute share almost nothing except the need. Programs are scoped to what is actually happening in your building."
          />

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {segments.map((s, i) => (
              <Reveal key={s.id} delay={0.06 * (i % 3)} className="h-full">
                <article className="card-lift group relative flex h-full flex-col overflow-hidden rounded-2xl border border-forest-800/10 bg-ivory-light p-7 shadow-lift">
                  <span
                    className="pointer-events-none absolute -right-3 -top-4 select-none font-deva text-[3.4rem] leading-none text-forest-800/[0.06] transition-colors duration-500 group-hover:text-forest-800/[0.11]"
                    aria-hidden="true"
                  >
                    {s.deva}
                  </span>

                  <h3 className="pr-16 font-display text-xl font-medium leading-snug text-forest-900">
                    {s.name}
                  </h3>
                  <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold-dark">
                    {s.who}
                  </p>
                  <p className="mt-4 text-[0.93rem] leading-relaxed text-ink/70">{s.pressure}</p>

                  <ul className="mt-auto space-y-2.5 pt-6">
                    {s.offering.map((o) => (
                      <li key={o} className="flex gap-3 text-[0.88rem] leading-relaxed text-ink/65">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                        {o}
                      </li>
                    ))}
                  </ul>

                  <span
                    className="absolute inset-x-0 bottom-0 h-[3px] w-0 bg-gold transition-all duration-700 ease-silk group-hover:w-full"
                    aria-hidden="true"
                  />
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── what a program is made of ────────────────────────────── */}
      <section className="section bg-forest-950 text-ivory">
        <div className="wrap-wide">
          <SectionHeading
            eyebrow="what's inside"
            deva="मन"
            title="Six parts. You take what fits."
            description="Nothing here is a bundle you have to buy whole. Most programs start with two or three of these and grow."
            dark
          />

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={0.06 * (i % 3)} className="h-full">
                <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-7">
                  <span className="gold-rule" aria-hidden="true" />
                  <h3 className="mt-5 font-display text-[1.25rem] font-medium leading-snug text-ivory">
                    {p.title}
                  </h3>
                  <p className="mt-3 flex-1 text-[0.92rem] leading-relaxed text-sage-light/75">
                    {p.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── how it starts ────────────────────────────────────────── */}
      <section className="section">
        <div className="wrap-wide">
          <SectionHeading
            eyebrow="how it starts"
            deva="मन"
            title="A pilot with an end date"
            description="No annual contract before anyone has seen it work. Scope small, measure honestly, then decide."
          />

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {steps.map((s, i) => (
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

      {/* ── faq ──────────────────────────────────────────────────── */}
      <section className="section bg-sage-light/30">
        <div className="wrap">
          <SectionHeading
            eyebrow="before you ask"
            deva="मन"
            title="The questions procurement asks first"
          />
          <Accordion items={orgFaqs} />
        </div>
      </section>

      {/* ── enquiry ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-forest-900 py-24 md:py-32">
        <span
          className="pointer-events-none absolute -right-10 top-1/2 -translate-y-1/2 select-none font-deva text-[16rem] leading-none text-ivory/[0.04] md:text-[26rem]"
          aria-hidden="true"
        >
          संस्था
        </span>
        <div className="wrap-wide relative z-10 max-w-3xl">
          <Reveal>
            <p className="eyebrow mb-5 text-sage">
              <span className="font-deva normal-case tracking-normal text-gold" aria-hidden="true">
                मन
              </span>{" "}
              let&apos;s scope it
            </p>
            <h2 className="h-display text-4xl text-ivory md:text-[3.4rem]">
              Tell us what you&apos;re seeing.
            </h2>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-sage-light/80">
              Send us your institution, rough headcount, and what prompted this.
              We&apos;ll come back within two working days with either a scoping call
              or an honest note saying we&apos;re not the right fit.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button href={enquiry} external variant="gold">
                Email an enquiry
              </Button>
              <Button href="/contact" variant="outline-light">
                Use the contact form
              </Button>
            </div>
            <p className="mt-8 text-sm text-sage-light/60">
              Prefer to talk? {site.phone} · or find us on{" "}
              <Link href={site.whatsapp} className="link-draw font-medium text-ivory">
                WhatsApp
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
