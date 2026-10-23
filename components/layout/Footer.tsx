"use client";

import Link from "next/link";
import EmailLink from "@/components/contact/EmailLink";
import Image from "next/image";
import CookieSettingsButton from "@/components/legal/CookieSettingsButton";
import { navLinks, site } from "@/lib/site";
import { useLocale } from "@/lib/i18n/client";
import { hasHindi, localePath } from "@/lib/i18n";
import { chromeCopy, linkCopy } from "@/lib/i18n/chrome";

/*
 * Social links and the monthly-letter signup are left out until they are real:
 * a "#" link is a broken link, and a signup that stores nothing is a promise
 * we cannot keep. Add them back here once the accounts / mailing list exist.
 */
export default function Footer() {
  const locale = useLocale();
  const c = chromeCopy(locale).footer;
  // to the Hindi page where one exists, otherwise the English one
  const to = (href: string) => (hasHindi(href) ? localePath(locale, href) : href);
  const legal = [
    { href: "/privacy", label: c.privacy },
    { href: "/terms", label: c.terms },
    { href: "/refund-policy", label: c.refund },
    { href: "/cookies", label: c.cookies },
  ];

  return (
    <footer data-site-footer lang={locale} className="bg-forest-950 text-ivory">
      <div className="wrap-wide grid gap-14 py-20 md:grid-cols-12 md:py-24">
        <div className="md:col-span-5">
          <Link href={to("/")} aria-label="Emoraa home" className="inline-block">
            {/*
              The wordmark plus the tagline as live text, not the lockup PNG.
              That PNG has the tagline baked into its pixels, so changing the
              tagline left the image saying one thing and the alt text another.
              As text it follows `site.tagline`, can be read by a screen
              reader, and translates. `alt=""` because the link's own
              aria-label already names it.
            */}
            <Image
              src="/brand/emoraa-wordmark.png"
              alt=""
              width={1200}
              height={230}
              className="h-9 w-auto brightness-0 invert md:h-10"
            />
            <span className="mt-2 block text-center text-small font-semibold uppercase tracking-[0.26em] text-ivory/75">
              {site.tagline.replace(/\.$/, "")}
            </span>
          </Link>
          <p className="mt-5 max-w-sm leading-relaxed text-sage-light/75">
            {c.blurb}
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="eyebrow mb-5 text-sage">{c.explore}</p>
          <ul className="space-y-3 text-body">
            {[{ href: "/", label: "Home" }, ...navLinks, { href: "/book", label: "Book a session" }]
              .map((l) => linkCopy(locale, l))
              .map((l) => (
              <li key={l.href}>
                <Link href={to(l.href)} className="link-draw text-sage-light/80 hover:text-ivory">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          <p className="eyebrow mb-5 text-sage">{c.reachUs}</p>
          <ul className="space-y-3 text-body text-sage-light/80">
            <li>
              <EmailLink className="link-draw hover:text-ivory" />
            </li>
            <li>
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="link-draw hover:text-ivory">
                {site.phone}
              </a>
            </li>
            <li>
              <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="link-draw hover:text-ivory">
                {c.whatsapp}
              </a>
            </li>
            <li className="pt-1 text-sage-light/75">{site.location}</li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="eyebrow mb-5 text-sage">{c.legal}</p>
          <ul className="space-y-3 text-body">
            {legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="link-draw text-sage-light/80 hover:text-ivory">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <CookieSettingsButton className="link-draw text-sage-light/80 hover:text-ivory" label={c.cookieSettings} />
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="wrap-wide py-6">
          <p className="text-small leading-relaxed text-sage-light/75">
            <span className="text-gold">{c.inCrisis}</span> {c.callTeleManas}{" "}
            <a href="tel:14416" className="font-semibold text-ivory underline decoration-gold/50 underline-offset-4">
              14416
            </a>{" "}
            {c.crisisRest}
          </p>
          <p className="mt-4 text-small text-sage-light/70">{c.madeWithCare}</p>
        </div>
      </div>
    </footer>
  );
}
