import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import FloatingOrbs from "@/components/ui/FloatingOrbs";
import Button from "@/components/ui/Button";
import { copy } from "@/lib/i18n/copy";
import { SERVICES_HI } from "@/lib/i18n/services-hi";
import { serviceAvailability } from "@/lib/service-catalogue";
import { services } from "@/lib/services";
import { helplines, site } from "@/lib/site";
import Price from "@/components/ui/Price";
import { standardPrice } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Emoraa — भारत के लिए ऑनलाइन थेरेपी",
  description:
    "योग्य भारतीय मनोवैज्ञानिकों से निजी ऑनलाइन बातचीत — हिन्दी में। ₹599 से शुरू।",
  alternates: {
    canonical: "/hi",
    languages: { "en-IN": "/", "hi-IN": "/hi" },
  },
  openGraph: {
    title: "Emoraa — आपकी भावनाएँ मायने रखती हैं",
    description: "योग्य भारतीय मनोवैज्ञानिकों से निजी ऑनलाइन बातचीत, हिन्दी में।",
    locale: "hi_IN",
    // setting openGraph here replaces the root one, image included
    images: ["/opengraph-image.png"],
  },
};

/**
 * The Hindi home page.
 *
 * Written rather than translated, and deliberately shorter than the English
 * one. Somebody who switched to Hindi has usually done it because the English
 * page was work to read; giving them the same eight scrolling sections in
 * Devanagari would be the same amount of work in a different script.
 *
 * So: the promise, the three things people ask before booking, the formats, and
 * the way in. The crisis number is above all of it, because the first Hindi
 * visitor who needs it should not have to scroll.
 */
export default async function HindiHome() {
  /* The same availability the English pages read, so a Hindi card cannot
     quote a different number from its English twin. */
  const rows = await serviceAvailability();

  const t = copy("hi");
  const telemanas = helplines.find((h) => h.number === "14416") ?? helplines[0];
  const popular = ["individual-therapy", "student-support", "daily-life-stress", "couples-counseling"];

  return (
    <>
      {/* ── the promise ──────────────────────────────────────────────────── */}
      <section className="page-top relative overflow-hidden pb-20 md:pb-28">
        <FloatingOrbs />
        <div className="wrap relative">
          <Reveal>
            <p className="eyebrow mb-5 flex items-center gap-3">
              <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">
                मन
              </span>
              {t.home.eyebrow}
            </p>
            <h1 className="h-display max-w-3xl text-4xl leading-[1.15] md:text-6xl">
              {t.home.headline} <em className="text-gold-dark">{t.home.headlineAccent}</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/75">{t.home.lede}</p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button href="/hi/book" variant="gold">
                {t.home.ctaBook}
              </Button>
              <Link href="/hi/services" className="link-draw font-medium text-forest-800">
                {t.services.title} देखिए
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.16}>
            <dl className="mt-14 grid max-w-2xl gap-6 sm:grid-cols-3">
              {t.home.trust.map((s) => (
                <div key={s.label}>
                  <dt className="font-display text-3xl font-medium text-forest-900">{s.value}</dt>
                  <dd className="mt-1 text-[0.9rem] text-ink/70">{s.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ── if it is urgent, it is here and not at the bottom ────────────── */}
      <section className="border-y border-red-200/60 bg-red-50/60 py-7">
        <div className="wrap flex flex-wrap items-center justify-between gap-4">
          <p className="text-[0.95rem] leading-relaxed text-ink/80">
            अगर अभी बहुत बुरा लग रहा है और इंतज़ार नहीं हो सकता — {telemanas.name} पर कॉल कीजिए।
            मुफ़्त, गोपनीय, 24 घंटे, 20+ भारतीय भाषाओं में।
          </p>
          <a
            href={`tel:${telemanas.dial}`}
            className="press shrink-0 rounded-full bg-red-600 px-6 py-3 font-display text-lg font-semibold text-white transition-colors hover:bg-red-700"
          >
            {telemanas.number}
          </a>
        </div>
      </section>

      {/* ── how it works ─────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="wrap">
          <Reveal>
            <p className="eyebrow mb-4">{t.home.howEyebrow}</p>
            <h2 className="h-display max-w-xl text-3xl md:text-4xl">{t.home.howTitle}</h2>
          </Reveal>

          <div className="mt-12 grid gap-7 md:grid-cols-3">
            {t.home.how.map((step, i) => (
              <Reveal key={step.step} delay={0.07 * i}>
                <div className="h-full rounded-3xl border border-forest-800/10 bg-ivory-light p-7">
                  <p className="font-display text-[0.95rem] text-gold">{step.step}</p>
                  <h3 className="mt-3 font-display text-xl font-medium text-forest-900">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 leading-relaxed text-ink/70">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── why ──────────────────────────────────────────────────────────── */}
      <section className="bg-sage-light/25 py-20 md:py-28">
        <div className="wrap">
          <Reveal>
            <p className="eyebrow mb-4">{t.home.whyEyebrow}</p>
            <h2 className="h-display max-w-xl text-3xl md:text-4xl">{t.home.whyTitle}</h2>
          </Reveal>

          <div className="mt-12 grid gap-x-10 gap-y-9 md:grid-cols-2">
            {t.home.why.map((w, i) => (
              <Reveal key={w.title} delay={0.06 * i}>
                <h3 className="font-display text-xl font-medium text-forest-900">{w.title}</h3>
                <p className="mt-2 max-w-md leading-relaxed text-ink/70">{w.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── the formats people actually pick ─────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="wrap">
          <Reveal>
            <p className="eyebrow mb-4">{t.services.eyebrow}</p>
            <h2 className="h-display max-w-xl text-3xl md:text-4xl">{t.services.title}</h2>
          </Reveal>

          <div className="mt-11 grid gap-5 sm:grid-cols-2">
            {popular.map((slug, i) => {
              const row = rows.find((r) => r.service.slug === slug);
              const s = row?.service;
              const h = SERVICES_HI[slug];
              if (!s || !h) return null;
              return (
                <Reveal key={slug} delay={0.06 * i}>
                  <Link
                    href="/hi/services"
                    className="card-lift block h-full rounded-3xl border border-forest-800/10 bg-ivory-light p-7"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-display text-xl font-medium text-forest-900">
                        {h.title}
                      </h3>
                      <span className="shrink-0">
                        <Price
                          amount={row?.priceRange ? row.priceRange.min : s.price}
                          upto={row?.priceRange ? row.priceRange.max : null}
                          standard={standardPrice("service", s.slug, s.price)}
                          size="sm"
                          showBadge={false}
                        />
                      </span>
                    </div>
                    <p className="mt-2.5 leading-relaxed text-ink/70">{h.summary}</p>
                    <p className="mt-4 text-[0.82rem] text-ink/70">
                      {h.duration} · {t.services.perSession}
                    </p>
                  </Link>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={0.1}>
            <Link
              href="/hi/services"
              className="link-draw mt-9 inline-block font-medium text-forest-800"
            >
              सारी सेवाएँ देखिए
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── the ask ──────────────────────────────────────────────────────── */}
      <section className="bg-forest-950 py-20 text-ivory md:py-28">
        <div className="wrap text-center">
          <Reveal>
            <h2 className="h-display mx-auto max-w-lg text-3xl text-ivory md:text-4xl">
              {t.home.closingTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-ivory/70">{t.home.closingBody}</p>
            <div className="mt-9">
              <Button href="/hi/book" variant="gold">
                {t.home.closingCta}
              </Button>
            </div>
            <p className="mx-auto mt-8 max-w-lg text-[0.85rem] leading-relaxed text-ivory/50">
              {t.common.confidential} {t.common.languageNote}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── the honest footnote ──────────────────────────────────────────── */}
      <section className="border-t border-forest-800/10 py-10">
        <div className="wrap">
          <p className="max-w-2xl text-[0.85rem] leading-relaxed text-ink/70">
            हमारी बाक़ी साइट — ब्लॉग, लंबे लेख और कुछ टूल — फ़िलहाल अंग्रेज़ी में हैं। सेशन हिन्दी
            में होते हैं, और यही सबसे ज़रूरी हिस्सा है। किसी भी सवाल के लिए{" "}
            <a href={`mailto:${site.email}`} className="link-draw font-medium text-forest-800">
              {site.email}
            </a>{" "}
            पर लिखिए।{" "}
            <Link href="/" className="link-draw font-medium text-forest-800">
              {t.common.readInEnglish}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
