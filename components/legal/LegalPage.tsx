import type { ReactNode } from "react";
import Link from "next/link";

export type LegalSection = { id: string; heading: string; body: ReactNode };

/**
 * A details-still-to-come marker. Rendered highlighted so an unfilled company
 * name or officer can't slip onto the live site unnoticed — search the repo for
 * `<Fill>` before launch and replace every one.
 */
export function Fill({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-gold/30 px-1 text-forest-900">[{children}]</mark>;
}

const others = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of use" },
  { href: "/refund-policy", label: "Refund & cancellation" },
  { href: "/cookies", label: "Cookie policy" },
];

/** Shared shell for the policy pages: title, date, contents list, sections. */
export default function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  sections,
  current,
}: {
  eyebrow: string;
  title: string;
  /** ISO date of the last material change, e.g. "2026-10-06". */
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
  /** This page's path, left out of the "other policies" row. */
  current: string;
}) {
  const date = new Date(`${updated}T00:00:00+05:30`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="page-top pb-24">
      <div className="wrap max-w-3xl">
        <p className="eyebrow mb-5">{eyebrow}</p>
        <h1 className="h-display text-[clamp(2.4rem,5vw,3.75rem)]">{title}</h1>
        <p className="mt-4 text-sm text-ink/70">Last updated {date}</p>
        <div className="mt-8 space-y-4 text-[1.02rem] leading-relaxed text-ink/80">{intro}</div>

        <nav aria-label="On this page" className="mt-10 rounded-3xl border border-forest-800/10 bg-sage-light/20 p-6">
          <p className="mb-3 text-sm font-semibold text-forest-800">On this page</p>
          <ol className="list-decimal space-y-1.5 pl-5 text-[0.95rem] text-ink/80">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="hit underline-offset-2 hover:text-forest-800 hover:underline">
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-28 pt-12">
            <h2 className="font-display text-2xl font-medium text-forest-900 md:text-[1.75rem]">
              {i + 1}. {s.heading}
            </h2>
            <div className="legal-body mt-4 space-y-4 text-[1rem] leading-relaxed text-ink/80 [&_a]:font-medium [&_a]:text-forest-800 [&_a]:underline [&_a]:underline-offset-2 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-forest-900 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
              {s.body}
            </div>
          </section>
        ))}

        <div className="mt-16 border-t border-forest-800/10 pt-8">
          <p className="text-sm font-semibold text-forest-800">Other policies</p>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[0.95rem]">
            {others
              .filter((o) => o.href !== current)
              .map((o) => (
                <li key={o.href}>
                  <Link href={o.href} className="hit text-ink/80 underline underline-offset-2 hover:text-forest-800">
                    {o.label}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
