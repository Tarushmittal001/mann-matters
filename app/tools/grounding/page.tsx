import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import FloatingOrbs from "@/components/ui/FloatingOrbs";
import GroundingExercise from "@/components/tools/GroundingExercise";

export const metadata: Metadata = {
  title: "5-4-3-2-1 grounding",
  description:
    "A free grounding exercise for anxious moments — five things you can see, four you can touch, three you can hear, two you can smell, one you can taste.",
};

export default function GroundingPage() {
  return (
    <section className="page-top relative overflow-hidden pb-24">
      <FloatingOrbs />
      <div className="wrap relative z-10">
        <Reveal className="mb-12 text-center">
          <p className="eyebrow mb-4 flex items-center justify-center gap-3">
            <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
            when the spiral starts
          </p>
          <h1 className="h-display text-4xl md:text-5xl">Come back to the room.</h1>
          <p className="mx-auto mt-5 max-w-lg leading-relaxed text-ink/70">
            Anxiety pulls you into what-ifs. Your five senses only exist right
            here, right now — so we&apos;ll use them as an anchor. Five things you
            see, four you feel, three you hear, two you smell, one you taste.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <GroundingExercise />
        </Reveal>
      </div>
    </section>
  );
}
