import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import { services } from "@/lib/services";
import { formatINR } from "@/lib/utils";

const icons: Record<string, JSX.Element> = {
  "individual-therapy": (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="14" cy="9" r="5" />
      <path d="M4.5 24c1.6-4.4 5.2-6.5 9.5-6.5s7.9 2.1 9.5 6.5" strokeLinecap="round" />
    </svg>
  ),
  "couples-counseling": (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M14 23s-8.5-5.4-8.5-11A4.7 4.7 0 0 1 14 9.2 4.7 4.7 0 0 1 22.5 12c0 5.6-8.5 11-8.5 11Z" strokeLinejoin="round" />
    </svg>
  ),
  "student-support": (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M3 10.5 14 5l11 5.5L14 16 3 10.5Z" strokeLinejoin="round" />
      <path d="M7.5 13v6c0 1.5 3 3.5 6.5 3.5s6.5-2 6.5-3.5v-6" strokeLinecap="round" />
    </svg>
  ),
  "corporate-wellness": (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="5" y="9" width="18" height="13" rx="2" />
      <path d="M10.5 9V6.5A1.5 1.5 0 0 1 12 5h4a1.5 1.5 0 0 1 1.5 1.5V9M5 15h18" strokeLinecap="round" />
    </svg>
  ),
};

export default function ServicesPreview() {
  const preview = services.filter((s) => s.slug !== "group-sessions");

  return (
    <section className="section bg-sage-light/30">
      <div className="wrap-wide">
        <SectionHeading
          eyebrow="what we offer"
          deva="मन"
          title="Care that fits the life you're actually living"
          description="Whether it's one season of stress or something you've carried for years — there's a format, a therapist, and a price that works."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {preview.map((s, i) => (
            <Reveal key={s.slug} delay={i * 0.1}>
              <Link
                href="/services"
                className="card-lift group flex h-full flex-col rounded-2xl border border-forest-800/10 bg-ivory-light p-7 shadow-lift"
              >
                <span className="text-forest-600">{icons[s.slug]}</span>
                <h3 className="mt-6 font-display text-[1.4rem] font-medium leading-snug text-forest-900">
                  {s.title}
                </h3>
                <p className="mt-3 flex-1 text-[0.92rem] leading-relaxed text-ink/65">
                  {s.description.split(". ")[0]}.
                </p>
                <div className="mt-6 flex items-center justify-between border-t border-forest-800/10 pt-5">
                  <span className="text-sm text-ink/60">
                    {s.price ? (
                      <>
                        from <span className="font-semibold text-forest-800">{formatINR(s.price)}</span>
                      </>
                    ) : (
                      "for teams"
                    )}
                  </span>
                  <span className="text-gold transition-transform duration-500 ease-silk group-hover:translate-x-1.5" aria-hidden="true">
                    →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
