import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import FloatingOrbs from "@/components/ui/FloatingOrbs";
import { copy } from "@/lib/i18n/copy";
import { SERVICES_HI } from "@/lib/i18n/services-hi";
import Price from "@/components/ui/Price";
import { regionFor, rgba } from "@/lib/palette";
import { standardPrice } from "@/lib/pricing";
import { serviceAvailability } from "@/lib/service-catalogue";

export const metadata: Metadata = {
  title: "सेवाएँ — थेरेपी और काउंसलिंग",
  description:
    "व्यक्तिगत थेरेपी, छात्रों के लिए, कपल और फ़ैमिली काउंसलिंग, नींद का कार्यक्रम और मनोचिकित्सा — सब ऑनलाइन और गोपनीय।",
  alternates: {
    canonical: "/hi/services",
    languages: { "en-IN": "/services", "hi-IN": "/hi/services" },
  },
};

/**
 * The service catalogue in Hindi.
 *
 * The same fourteen formats, the same photographs and the same prices — only
 * the words change, and they come from one file. Each card links to the Hindi
 * booking page rather than to the English detail page: the long write-ups are
 * still English, and sending somebody who just switched language into a wall
 * of English prose is the thing this page exists to avoid.
 */
export default async function HindiServicesPage() {
  const t = copy("hi");
  // same rule as the English page: only offer what someone can deliver
  const rows = await serviceAvailability();

  return (
    <>
      <section className="page-top relative overflow-hidden pb-16">
        <FloatingOrbs />
        <div className="wrap-wide relative">
          <Reveal>
            <p className="eyebrow mb-5 flex items-center gap-3">
              <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">
                मन
              </span>
              {t.services.eyebrow}
            </p>
            <h1 className="h-display max-w-3xl text-4xl md:text-6xl">
              हर परेशानी का अपना <em className="text-gold-dark">तरीक़ा</em> है।
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/75">{t.services.lede}</p>
          </Reveal>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="wrap-wide">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ service: s, bookable, priceRange }, i) => {
              const h = SERVICES_HI[s.slug];
              const region = regionFor(s.slug);
              return (
                <Reveal key={s.slug} delay={0.05 * (i % 3)} className="h-full">
                  <article
                    className="card-lift group flex h-full flex-col overflow-hidden rounded-3xl border border-forest-800/10 bg-ivory-light"
                    title={`${region.name} — ${region.emotion}`}
                    style={{ ["--accent" as string]: region.hex }}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={s.image}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-silk group-hover:scale-[1.04]"
                      />
                      <div
                        className="absolute inset-0"
                        aria-hidden="true"
                        style={{
                          background: `linear-gradient(to top, ${rgba(region.rgb, 0.55)}, transparent 62%)`,
                        }}
                      />
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <h2 className="font-display text-xl font-medium text-forest-900">
                        {h?.title ?? s.title}
                      </h2>
                      <p className="mt-2.5 flex-1 leading-relaxed text-ink/70">
                        {h?.summary ?? s.summary}
                      </p>

                      {/* the same launch pricing the English cards show — a
                          Hindi reader seeing the undiscounted number would be
                          reading a worse offer than the one we actually make */}
                      <div className="mt-5 flex items-end justify-between gap-4 border-t border-forest-800/10 pt-4">
                        <div>
                          {bookable ? (
                            <Price
                              amount={priceRange ? priceRange.min : s.price}
                              upto={priceRange ? priceRange.max : null}
                              standard={standardPrice("service", s.slug, s.price)}
                              size="sm"
                            />
                          ) : (
                            <p className="text-[0.9rem] text-ink/70">कीमत पूछने पर</p>
                          )}
                          <p className="mt-1 text-[0.8rem] text-ink/70">
                            {h?.duration ?? s.duration} · {t.services.perSession}
                          </p>
                        </div>
                        {bookable ? (
                          <Link
                            href={`/hi/book?service=${s.slug}`}
                            className="press shrink-0 rounded-full bg-forest-800 px-5 py-2.5 text-[0.85rem] font-semibold text-ivory transition-colors hover:bg-forest-700"
                          >
                            {t.nav.book}
                          </Link>
                        ) : (
                          <Link
                            href="/contact"
                            className="press shrink-0 rounded-full border border-forest-800/25 px-5 py-2.5 text-[0.85rem] font-semibold text-forest-800 transition-colors hover:border-forest-800"
                          >
                            हमसे पूछिए
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>

          <Reveal>
            <p className="mt-12 max-w-2xl text-[0.85rem] leading-relaxed text-ink/70">
              हर सेवा का पूरा ब्योरा फ़िलहाल अंग्रेज़ी में है —{" "}
              <Link href="/services" className="link-draw font-medium text-forest-800">
                {t.common.readInEnglish}
              </Link>
              . सेशन हिन्दी में होंगे, चाहे आपने बुकिंग किसी भी भाषा में की हो।
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
