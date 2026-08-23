import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import FloatingOrbs from "@/components/ui/FloatingOrbs";
import AffirmationCards from "@/components/tools/AffirmationCards";

export const metadata: Metadata = {
  title: "Affirmations",
  description:
    "Free bilingual affirmation cards in Hindi and English — small, true things to hold onto on a heavy day.",
};

export default function AffirmationsPage() {
  return (
    <section className="page-top relative overflow-hidden pb-24">
      <FloatingOrbs />
      <div className="wrap relative z-10">
        <Reveal className="mb-12 text-center">
          <p className="eyebrow mb-4 flex items-center justify-center gap-3">
            <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
            small, true things
          </p>
          <h1 className="h-display text-4xl md:text-5xl">A kinder voice, on loop.</h1>
          <p className="mx-auto mt-5 max-w-lg leading-relaxed text-ink/70">
            The mind believes what it hears most often — especially from you.
            These are small reminders in Hindi and English. Take the one that
            fits today.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <AffirmationCards />
        </Reveal>
      </div>
    </section>
  );
}
