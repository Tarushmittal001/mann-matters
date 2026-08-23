import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import BreathingExercise from "@/components/tools/BreathingExercise";

export const metadata: Metadata = {
  title: "Take a breath",
  description:
    "A free one-minute guided breathing exercise — box breathing to slow a racing mind. In for four, hold, out for four.",
};

export default function BreathePage() {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-forest-950 text-ivory">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 50% 45%, rgba(168,195,181,0.16), transparent 70%)",
        }}
      />
      <div className="wrap relative z-10 flex flex-col items-center py-28 text-center">
        <Reveal>
          <p className="eyebrow mb-4 text-sage">
            <span className="font-deva normal-case tracking-normal text-gold" aria-hidden="true">मन</span> a quiet minute
          </p>
          <h1 className="h-display text-4xl text-ivory md:text-5xl">Let&apos;s breathe, together.</h1>
          <p className="mx-auto mt-5 max-w-md leading-relaxed text-sage-light/80">
            Follow the circle. Breathe in as it grows, hold, and breathe out as it
            settles. A few rounds is all it takes to feel the ground again.
          </p>
        </Reveal>
        <Reveal delay={0.15} className="mt-12">
          <BreathingExercise tone="dark" />
        </Reveal>
      </div>
    </section>
  );
}
