import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import FloatingOrbs from "@/components/ui/FloatingOrbs";
import { site } from "@/lib/site";
import { TOOL_ICONS, ToolEmblem } from "@/components/icons/ToolIcons";
import { tools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Free tools",
  description:
    "Free, private mental-health tools — guided breathing, 5-4-3-2-1 grounding, muscle relaxation, calming sounds, a sleep wind-down, a worry journal, affirmations, and a gentle mood check-in. No sign-up, no tracking.",
};

export default function ToolsPage() {
  return (
    <>
      <section className="page-top relative overflow-hidden pb-16">
        <FloatingOrbs />
        <div className="wrap-wide relative z-10">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center md:mb-20">
            <p className="eyebrow mb-4 flex items-center justify-center gap-3">
              <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
              free, private, no sign-up
            </p>
            <h1 className="h-display text-4xl md:text-5xl lg:text-[3.4rem]">
              Small tools for a heavy day.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-ink/70">
              You don&apos;t need an appointment to start feeling a little
              better. Everything here is free, works right in your browser, and
              nothing you do is tracked or stored.
            </p>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool, i) => (
              <Reveal key={tool.href} delay={(i % 3) * 0.1}>
                <Link
                  href={tool.href}
                  className="card-lift group relative flex h-full flex-col overflow-hidden rounded-2xl border border-forest-800/10 bg-ivory-light p-7 shadow-lift"
                >
                  {tool.art && (
                    <span className="absolute inset-0" aria-hidden="true">
                      <Image
                        src={tool.art.src}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                        className={`object-cover ${tool.art.pos} opacity-40 transition-all duration-700 ease-silk group-hover:scale-[1.03] group-hover:opacity-55`}
                      />
                      <span
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to top, rgba(252,250,246,0.97) 8%, rgba(252,250,246,0.82) 48%, rgba(252,250,246,0.3) 100%)",
                        }}
                      />
                    </span>
                  )}
                  <span className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between">
                      <ToolEmblem>{TOOL_ICONS[tool.icon]({})}</ToolEmblem>
                      <span className="rounded-full bg-sage-light/50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-forest-700">
                        {tool.time}
                      </span>
                    </div>
                    <h2 className="mt-6 font-display text-[1.4rem] font-medium leading-snug text-forest-900">
                      {tool.title}
                    </h2>
                    <p className="mt-3 flex-1 text-[0.95rem] leading-relaxed text-ink/65">
                      {tool.body}
                    </p>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-gold-dark">
                      best for {tool.best}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-forest-800">
                      Open
                      <span className="transition-transform duration-500 ease-silk group-hover:translate-x-1.5" aria-hidden="true">→</span>
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* tools help, but they're not therapy */}
      <section className="pb-24">
        <div className="wrap">
          <Reveal>
            <div className="rounded-3xl bg-forest-900 p-9 text-center shadow-bloom sm:p-12">
              <p className="font-deva text-lg text-gold" aria-hidden="true">मन</p>
              <h2 className="mt-3 font-display text-2xl font-medium text-ivory md:text-3xl">
                If the day feels heavier than a tool can hold —
              </h2>
              <p className="mx-auto mt-4 max-w-xl leading-relaxed text-sage-light/80">
                these exercises are a first step, not a substitute for real
                support. Talking to a licensed psychologist is the next one, and
                it&apos;s easier than you think.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/match"
                  className="rounded-full bg-gold px-7 py-3 text-sm font-semibold text-forest-950 transition-colors hover:bg-gold-dark"
                >
                  Find your therapist
                </Link>
                <Link
                  href="/crisis"
                  className="rounded-full border border-ivory/25 px-7 py-3 text-sm font-semibold text-ivory transition-colors hover:border-ivory hover:bg-ivory hover:text-forest-900"
                >
                  In crisis? Get help now
                </Link>
              </div>
              <p className="mx-auto mt-6 max-w-xl text-xs leading-relaxed text-sage-light/60">
                {site.crisisNote}
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
