import Image from "next/image";
import Link from "next/link";
import Price from "@/components/ui/Price";
import { standardPrice } from "@/lib/pricing";
import Reveal from "@/components/ui/Reveal";
import { services } from "@/lib/services";
import { regionFor, rgba } from "@/lib/palette";

/**
 * The ten services, as a menu: photo, name, one line, price, and the way in.
 *
 * The full description and the what-you-get bullets used to sit on every card,
 * which made the grid five screens of reading. They live on each service page
 * instead, one tap away, and the grid only has to help someone choose.
 *
 * This replaced a run of full-width alternating image/text blocks. Each was
 * fine on its own, but a column of them is the shape of every services
 * page on the internet — you scroll past most of them to find the one you came
 * for. As cards they can be compared, which is what someone choosing a format
 * is actually doing.
 *
 * Deliberately the same card as `SegmentGrid` on the institutions page: the
 * photograph of the room, the Devanagari mark watermarked onto it, the gold
 * rule that draws itself along the bottom on hover. The two pages sell
 * different things to different people and should still look like one company.
 *
 * The full write-up for each format lives at /services/[slug]; this card is the
 * decision, not the detail.
 *
 * Each card wears one of the brain regions from the home page — the colour is
 * set once as a CSS variable on the article and everything inside reads it, so
 * a card's identity is one line in lib/palette.ts rather than ten class names.
 */
export default function ServiceGrid() {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {services.map((s, i) => {
        const region = regionFor(s.slug);
        return (
        <Reveal key={s.slug} delay={0.06 * (i % 3)} className="h-full">
          <article
            id={s.slug}
            title={`${region.name} — ${region.emotion}`}
            style={{ ["--accent" as string]: region.hex, ["--accent-soft" as string]: rgba(region.rgb, 0.14) }}
            className="card-lift group relative flex h-full scroll-mt-28 flex-col overflow-hidden rounded-2xl border border-forest-800/10 bg-ivory-light shadow-lift"
          >
            {/* the region's colour, as a rule across the top of the card */}
            <span
              className="absolute inset-x-0 top-0 z-10 h-[3px] bg-[color:var(--accent)]"
              aria-hidden="true"
            />
            {/* the room this format happens in */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-forest-900/5">
              <Image
                src={s.image}
                alt={s.imageAlt}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-[900ms] ease-silk group-hover:scale-[1.04]"
              />
              {/* keeps the Devanagari legible over any photograph, and tints the
                  foot of the image with the card's region so the colour is on
                  the photograph rather than only in the small print */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-forest-950/20 to-transparent"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 opacity-70 transition-opacity duration-700 ease-silk group-hover:opacity-100"
                aria-hidden="true"
                style={{
                  background:
                    "linear-gradient(to top, var(--accent) -10%, transparent 55%)",
                  mixBlendMode: "multiply",
                }}
              />
              <span
                className="pointer-events-none absolute bottom-3 right-4 select-none font-deva text-[2.4rem] leading-none text-ivory/70 transition-colors duration-500 group-hover:text-[color:var(--accent)]"
                aria-hidden="true"
              >
                {s.deva}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-7">
              <h3 className="font-display text-xl font-medium leading-snug text-forest-900">
                {s.title}
              </h3>
              <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                {s.tag}
              </p>
              <p className="mt-3 text-[0.93rem] leading-relaxed text-ink/70">{s.summary}</p>

              {/* The two numbers someone is actually weighing, as a matched
                  pair: label, then figure, then the qualifier underneath.
                  Bottom-aligning them put the two labels on different lines
                  whenever a price note wrapped, and inlining the note after the
                  figure is what made it wrap. Both columns now sit on the same
                  two baselines in every card. */}
              <div className="mt-auto grid grid-cols-2 items-start gap-x-5 border-t border-forest-800/10 pt-6">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-ink/45">Duration</p>
                  <p className="mt-1.5 font-display text-lg font-medium leading-none text-forest-900">
                    {s.duration}
                  </p>
                </div>
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-ink/45">Pricing</p>
                  <div className="mt-1.5">
                    <Price
                      amount={s.price}
                      standard={standardPrice("service", s.slug, s.price)}
                      note={s.priceNote}
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-6">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/35 px-5 py-2.5 text-[0.85rem] font-semibold text-forest-800 transition duration-300 ease-silk hover:border-[color:var(--accent)] hover:bg-[color:var(--accent)] hover:text-ivory"
                >
                  Book this
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                    className="transition-transform duration-300 ease-silk group-hover:translate-x-0.5"
                  >
                    <path
                      d="M2 7h10M8 3l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
                <Link
                  href={`/services/${s.slug}`}
                  className="link-draw text-[0.85rem] font-medium text-forest-800"
                >
                  Read the detail
                </Link>
              </div>
            </div>

            <span
              className="absolute inset-x-0 bottom-0 h-[3px] w-0 bg-[color:var(--accent)] transition duration-700 ease-silk group-hover:w-full"
              aria-hidden="true"
            />
          </article>
        </Reveal>
        );
      })}
    </div>
  );
}
