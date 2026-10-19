"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";

/**
 * What a signed-out visitor sees in place of a free tool.
 *
 * ── WHY THERE IS A CRISIS ROUTE ON A SIGN-IN SCREEN ────────────────────────
 * Grounding and breathing are what someone reaches for at 2 a.m., and this
 * wall now stands between them and that. PRODUCT.md's first principle is
 * "safety before conversion — no design choice may push a distressed person
 * toward a sales funnel", so the wall carries the way out: Tele-MANAS, and
 * /crisis, which has a working breathing exercise built into the page and
 * needs no account. Never remove those two; the gate is only acceptable
 * because they are here.
 *
 * `usePathname` rather than a prop so every gated route sends the visitor
 * back to the exact tool they wanted after they sign in. A layout cannot know
 * its own path on the server, which is the only reason this is a client
 * component.
 */
export default function ToolWall() {
  const next = encodeURIComponent(usePathname());

  return (
    <section className="page-top pb-24">
      <div className="wrap">
        <div className="mx-auto max-w-lg rounded-2xl border border-forest-800/15 bg-ivory-light p-8 text-center shadow-lift sm:p-10">
          <p className="eyebrow mb-4 text-forest-600">Free, with an account</p>
          <h1 className="h-display text-[clamp(1.75rem,4vw,2.5rem)]">
            Sign in to use this tool
          </h1>
          <p className="mx-auto mt-4 max-w-sm leading-relaxed text-ink/70">
            Every tool on Emoraa is free and stays free. An account just keeps
            them yours — there is nothing to pay, now or later.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button href={`/signup?next=${next}`} variant="gold" size="sm">
              Create an account
            </Button>
            <Button href={`/login?next=${next}`} variant="outline" size="sm">
              Sign in
            </Button>
          </div>

          <div className="mt-8 border-t border-forest-800/15 pt-6 text-[0.9rem] leading-relaxed text-ink/70">
            <p className="font-medium text-forest-900">Need something right now?</p>
            <p className="mt-1.5">
              <Link href="/breathe" className="link-draw font-medium text-forest-700">
                Breathing
              </Link>
              ,{" "}
              <Link href="/tools/grounding" className="link-draw font-medium text-forest-700">
                grounding
              </Link>{" "}
              and{" "}
              <Link href="/tools/relax" className="link-draw font-medium text-forest-700">
                muscle relaxation
              </Link>{" "}
              need no account, and neither does the{" "}
              <Link href="/crisis" className="link-draw font-medium text-forest-700">
                crisis page
              </Link>
              . If you are not safe, call{" "}
              <a href="tel:14416" className="font-semibold text-forest-800">
                Tele-MANAS 14416
              </a>{" "}
              — free, 24x7 — or{" "}
              <a href="tel:112" className="font-semibold text-forest-800">
                112
              </a>{" "}
              in an emergency.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
