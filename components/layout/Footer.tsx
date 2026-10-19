"use client";

import Link from "next/link";
import EmailLink from "@/components/contact/EmailLink";
import Image from "next/image";
import CookieSettingsButton from "@/components/legal/CookieSettingsButton";
import { navLinks, site } from "@/lib/site";

/*
 * Social links and the monthly-letter signup are left out until they are real:
 * a "#" link is a broken link, and a signup that stores nothing is a promise
 * we cannot keep. Add them back here once the accounts / mailing list exist.
 */
const legal = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of use" },
  { href: "/refund-policy", label: "Refund & cancellation" },
  { href: "/cookies", label: "Cookie policy" },
];

export default function Footer() {
  return (
    <footer data-site-footer className="bg-forest-950 text-ivory">
      <div className="wrap-wide grid gap-14 py-20 md:grid-cols-12 md:py-24">
        <div className="md:col-span-5">
          <Link href="/" aria-label="Emoraa home" className="inline-block">
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
            <span className="mt-2 block text-center text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-ivory/75">
              {site.tagline.replace(/\.$/, "")}
            </span>
          </Link>
          <p className="mt-5 max-w-sm leading-relaxed text-sage-light/75">
            Therapy and counselling for Indian youth, students, and working
            professionals — confidential, affordable, and in your language.
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="eyebrow mb-5 text-sage">Explore</p>
          <ul className="space-y-3 text-[0.95rem]">
            {[{ href: "/", label: "Home" }, ...navLinks, { href: "/book", label: "Book a session" }].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="link-draw text-sage-light/80 hover:text-ivory">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          <p className="eyebrow mb-5 text-sage">Reach us</p>
          <ul className="space-y-3 text-[0.95rem] text-sage-light/80">
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
                WhatsApp us
              </a>
            </li>
            <li className="pt-1 text-sage-light/75">{site.location}</li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="eyebrow mb-5 text-sage">Legal</p>
          <ul className="space-y-3 text-[0.95rem]">
            {legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="link-draw text-sage-light/80 hover:text-ivory">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <CookieSettingsButton className="link-draw text-sage-light/80 hover:text-ivory" />
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="wrap-wide py-6">
          <p className="text-sm leading-relaxed text-sage-light/75">
            <span className="text-gold">In crisis?</span> Call Tele-MANAS{" "}
            <a href="tel:14416" className="font-semibold text-ivory underline decoration-gold/50 underline-offset-4">
              14416
            </a>{" "}
            — free, confidential, 24x7, in 20+ Indian languages. Emoraa is not a crisis service.
          </p>
          <p className="mt-4 text-sm text-sage-light/70">© 2026 Emoraa. Made with care in India.</p>
        </div>
      </div>
    </footer>
  );
}
