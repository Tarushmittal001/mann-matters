import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import FloatingOrbs from "@/components/ui/FloatingOrbs";
import MuscleRelaxation from "@/components/tools/MuscleRelaxation";

export const metadata: Metadata = {
  title: "Muscle relaxation",
  description:
    "A free guided progressive muscle relaxation — tense and release nine muscle groups in under three minutes to let the body put the mind down.",
};

export default function RelaxPage() {
  return (
    <section className="page-top relative overflow-hidden pb-24">
      <FloatingOrbs />
      <div className="wrap relative z-10">
        <Reveal className="mb-12 text-center">
          <p className="eyebrow mb-4 flex items-center justify-center gap-3">
            <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
            let the body lead
          </p>
          <h1 className="h-display text-4xl md:text-5xl">Unclench, one muscle at a time.</h1>
          <p className="mx-auto mt-5 max-w-lg leading-relaxed text-ink/70">
            Stress hides in the body — a tight jaw, raised shoulders, curled
            toes you never noticed. This guided tense-and-release walks from
            your hands to your feet and takes under three minutes.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <MuscleRelaxation />
        </Reveal>
      </div>
    </section>
  );
}
