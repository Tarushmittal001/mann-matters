import type { Metadata } from "next";
import Link from "next/link";
import { helplines } from "@/lib/site";

export const metadata: Metadata = {
  title: "No connection",
  robots: { index: false, follow: false },
};

/**
 * What the app shows when there is no signal.
 *
 * It leads with the phone numbers, because the one moment somebody opens this
 * app on a dead connection and genuinely cannot wait is a crisis, and a phone
 * call needs a network that a web page does not. Everything else on the page
 * is secondary to those two numbers.
 */
export default function OfflinePage() {
  const urgent = helplines.filter((h) => h.primary);

  return (
    <div className="page-top wrap pb-28">
      <p className="eyebrow mb-4 flex items-center gap-3">
        <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">
          मन
        </span>
        no connection
      </p>
      <h1 className="h-display text-4xl md:text-5xl">You&apos;re offline.</h1>
      <p className="mt-4 max-w-xl text-ink/70">
        We can&apos;t reach Emoraa from here. A call still works when a web page doesn&apos;t —
        these numbers are free and answer 24x7.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {urgent.map((h) => (
          <a
            key={h.number}
            href={`tel:${h.dial}`}
            className="card-lift rounded-2xl border border-forest-800/12 bg-ivory-light p-6"
          >
            <p className="font-display text-3xl font-medium text-forest-900">{h.number}</p>
            <p className="mt-1.5 font-medium text-forest-800">{h.name}</p>
            <p className="mt-1 text-[0.88rem] leading-relaxed text-ink/70">{h.note}</p>
          </a>
        ))}
      </div>

      <div className="mt-12 border-t border-forest-800/10 pt-8">
        <p className="text-[0.92rem] text-ink/70">
          Some things still work without a connection, if you&apos;ve opened them before:
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2.5">
          {[
            { href: "/breathe", label: "Breathe" },
            { href: "/tools/grounding", label: "5-4-3-2-1 grounding" },
            { href: "/tools", label: "All free tools" },
            { href: "/crisis", label: "All helplines" },
          ].map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="hit link-draw font-medium text-forest-800">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
