import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import TherapistMatcher from "@/components/tools/TherapistMatcher";
import FloatingOrbs from "@/components/ui/FloatingOrbs";

export const metadata: Metadata = {
  title: "Find your therapist",
  description:
    "Answer three quick questions about your concern, language, and budget, and we'll match you with a licensed psychologist who fits.",
};

export default function MatchPage({
  searchParams,
}: {
  searchParams: { concern?: string };
}) {
  const concern = searchParams?.concern;

  return (
    <section className="page-top relative overflow-hidden pb-24">
      <FloatingOrbs />
      <div className="wrap relative z-10">
        <Reveal className="mb-12 text-center">
          <p className="eyebrow mb-4 flex items-center justify-center gap-3">
            <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
            a better starting point
          </p>
          <h1 className="h-display text-4xl md:text-5xl">Find the right therapist for you</h1>
          <p className="mx-auto mt-5 max-w-lg leading-relaxed text-ink/70">
            Choosing can feel like the hardest part. Tell us three things, and
            we&apos;ll point you to a licensed psychologist who fits your concern,
            language, and budget.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <TherapistMatcher initialConcernId={concern} />
        </Reveal>
      </div>
    </section>
  );
}
