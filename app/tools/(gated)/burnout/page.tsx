import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import FloatingOrbs from "@/components/ui/FloatingOrbs";
import BurnoutCheck from "@/components/tools/BurnoutCheck";

export const metadata: Metadata = {
  title: "Burnout check",
  alternates: { canonical: "/tools/burnout" },
  description:
    "A free, private burnout reflection across the three things that matter: exhaustion, distance from the work, and whether it still feels worth it.",
};

export default function Page() {
  return (
    <section className="page-top relative overflow-hidden pb-24">
      <FloatingOrbs />
      <div className="wrap relative z-10">
        <Reveal className="mb-12 text-center">
          <p className="eyebrow mb-4 flex items-center justify-center gap-3">
            <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
            a mirror, not a diagnosis
          </p>
          <h1 className="h-display text-4xl md:text-5xl">Is it burnout, or a bad week?</h1>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-ink/70">
            Twelve questions across the three things burnout is made of. No score goes anywhere — it stays on this screen, for you.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <BurnoutCheck />
        </Reveal>
      </div>
    </section>
  );
}
