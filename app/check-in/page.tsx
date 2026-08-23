import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import MoodCheckIn from "@/components/tools/MoodCheckIn";
import FloatingOrbs from "@/components/ui/FloatingOrbs";

export const metadata: Metadata = {
  title: "Mood check-in",
  description:
    "A gentle two-minute check-in. Four questions, a kind reflection, and a next step that fits — never a diagnosis.",
};

export default function CheckInPage() {
  return (
    <section className="page-top relative overflow-hidden pb-24">
      <FloatingOrbs />
      <div className="wrap relative z-10">
        <Reveal className="mb-12 text-center">
          <p className="eyebrow mb-4 flex items-center justify-center gap-3">
            <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
            two quiet minutes
          </p>
          <h1 className="h-display text-4xl md:text-5xl">How are you, really?</h1>
          <p className="mx-auto mt-5 max-w-lg leading-relaxed text-ink/70">
            Four small questions. No right answers, no scores to fear — just a moment
            to notice how you&apos;ve been, and a gentle nudge toward what might help.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <MoodCheckIn />
        </Reveal>
      </div>
    </section>
  );
}
