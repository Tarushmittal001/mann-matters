"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { navLinks, site } from "@/lib/site";

const socials = [
  { label: "Instagram", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "YouTube", href: "#" },
];

export default function Footer() {
  const [subscribed, setSubscribed] = useState(false);

  const onSubscribe = (e: FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
  };

  return (
    <footer className="bg-forest-950 text-ivory">
      <div className="wrap-wide grid gap-14 py-20 md:grid-cols-12 md:py-24">
        <div className="md:col-span-5">
          <p className="flex items-baseline gap-2 font-display text-2xl font-semibold tracking-tight">
            mann Matters
            <span className="font-deva text-base text-gold" aria-hidden="true">
              मन
            </span>
          </p>
          <p className="mt-5 max-w-sm leading-relaxed text-sage-light/75">
            Therapy and counselling for Indian youth, students, and working
            professionals — confidential, affordable, and in your language.
          </p>
          {subscribed ? (
            <p className="mt-8 text-sm text-gold">
              You&apos;re in. One thoughtful letter a month — no noise, we promise.
            </p>
          ) : (
            <form className="mt-8 flex max-w-sm gap-2" onSubmit={onSubscribe}>
              <label htmlFor="newsletter" className="sr-only">
                Email address for our monthly letter
              </label>
              <input
                id="newsletter"
                type="email"
                required
                placeholder="Your email — one letter a month"
                className="w-full rounded-full border border-ivory/15 bg-ivory/5 px-5 py-3 text-sm text-ivory placeholder:text-sage-light/50 focus:border-gold focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-forest-950 transition-colors hover:bg-gold-dark"
              >
                Join
              </button>
            </form>
          )}
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
              <a href={`mailto:${site.email}`} className="link-draw hover:text-ivory">
                {site.email}
              </a>
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
            <li className="pt-1 text-sage-light/55">{site.location}</li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="eyebrow mb-5 text-sage">Follow</p>
          <ul className="space-y-3 text-[0.95rem]">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} className="link-draw text-sage-light/80 hover:text-ivory">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="wrap-wide py-6">
          <p className="text-sm leading-relaxed text-sage-light/60">
            <span className="text-gold">In crisis?</span> Call Tele-MANAS{" "}
            <a href="tel:14416" className="font-semibold text-ivory underline decoration-gold/50 underline-offset-4">
              14416
            </a>{" "}
            — free, confidential, 24x7, in 20+ Indian languages. mann Matters is not a crisis service.
          </p>
          <p className="mt-4 text-sm text-sage-light/40">© 2026 mann Matters. Made with care in India.</p>
        </div>
      </div>
    </footer>
  );
}
