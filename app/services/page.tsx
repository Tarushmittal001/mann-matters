import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import FloatingOrbs from "@/components/ui/FloatingOrbs";
import CTABand from "@/components/sections/CTABand";
import { comparison, services } from "@/lib/services";
import { therapyPages } from "@/lib/therapy-pages";
import { formatINR, cn } from "@/lib/utils";
import WayThrough from "@/components/visuals/WayThrough";

export const metadata: Metadata = {
  title: "Services — Therapy, counselling & wellness programs",
  description:
    "Individual therapy from ₹999, couples counselling, student support from ₹599, corporate wellness, and group sessions. Online, confidential, in 2+ languages.",
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
      {/* a lane per service: agitated on the left, settled on the right — click to help one settle */}
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
          <WayThrough />
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
              Five formats of care, one standard: a licensed professional,
              complete confidentiality, and a price you can actually sustain.
            </p>
          </Reveal>
        </div>
      </section>

      {/* alternating service sections */}
      <div className="space-y-0">
        {services.map((s, i) => {
          const flip = i % 2 === 1;
          return (
            <section key={s.slug} id={s.slug} className={cn("section", flip && "bg-sage-light/30")}>
              <div className="wrap-wide grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
                <Reveal className={cn(flip && "lg:order-2")}>
                  <div className="group overflow-hidden rounded-3xl shadow-bloom">
                    <Image
                      src={s.image}
                      alt={s.imageAlt}
                      width={1200}
                      height={900}
                      className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-silk group-hover:scale-[1.04]"
                      sizes="(max-width: 1024px) 92vw, 45vw"
                    />
                  </div>
                </Reveal>

                <Reveal delay={0.12} className={cn(flip && "lg:order-1")}>
                  <p className="eyebrow mb-4">{s.tag}</p>
                  <h2 className="h-display text-4xl md:text-[2.9rem]">{s.title}</h2>
                  <p className="mt-5 max-w-xl leading-relaxed text-ink/70">{s.description}</p>

                  <ul className="mt-8 space-y-3.5">
                    {s.expect.map((point) => (
                      <li key={point} className="flex items-start gap-3 text-[0.97rem] text-ink/80">
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-forest-800/10 pt-7">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-ink/50">Duration</p>
                      <p className="mt-1 font-display text-xl font-medium text-forest-900">{s.duration}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-ink/50">Pricing</p>
                      <p className="mt-1 font-display text-xl font-medium text-forest-900">
                        {s.price ? `${formatINR(s.price)} ` : ""}
                        <span className="font-sans text-sm font-normal text-ink/60">{s.priceNote}</span>
                      </p>
                    </div>
                    <div className="ml-auto">
                      <div className="flex flex-wrap items-center justify-end gap-4">
                        <Link href={`/services/${s.slug}`} className="link-draw text-sm font-medium text-forest-800">
                          Explore details
                        </Link>
                        <Button href="/book" variant={flip ? "forest" : "gold"}>
                          Book this
                        </Button>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            </section>
          );
        })}
      </div>

      <section className="section bg-forest-950 text-ivory">
        <div className="wrap-wide grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <p className="eyebrow text-sage">care that meets you there</p>
            <h2 className="h-display mt-4 !text-ivory text-3xl md:text-5xl">
              Find therapy by place or language.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-sage-light/75">
              Sessions are online across India. These guides help you find the practical and
              cultural fit that makes starting easier.
            </p>
          </Reveal>
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

      {/* comparison table */}
      <section className="section">
        <div className="wrap">
          <Reveal className="mb-12 max-w-2xl">
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
              at a glance
            </p>
            <h2 className="h-display text-4xl md:text-5xl">Every format, side by side</h2>
          </Reveal>

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
