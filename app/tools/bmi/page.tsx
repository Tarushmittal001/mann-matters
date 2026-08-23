import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import FloatingOrbs from "@/components/ui/FloatingOrbs";
import BmiCalculator from "@/components/tools/BmiCalculator";

export const metadata: Metadata = {
  title: "BMI calculator",
  description:
    "A free, gentle BMI calculator using WHO Asia-Pacific cutoffs — a screening number in context, never a verdict. Nothing you enter is stored or sent anywhere.",
};

export default function BmiPage() {
  return (
    <section className="page-top relative overflow-hidden pb-24">
      <FloatingOrbs />
      <div className="wrap relative z-10">
        <Reveal className="mb-12 text-center">
          <p className="eyebrow mb-4 flex items-center justify-center gap-3">
            <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
            just a number, held gently
          </p>
          <h1 className="h-display text-4xl md:text-5xl">Your BMI, in context.</h1>
          <p className="mx-auto mt-5 max-w-lg leading-relaxed text-ink/70">
            Body mass index is a rough first-glance number — useful, blunt, and
            often quoted without kindness. This one uses the WHO cutoffs made
            for Asian bodies, stays on your device, and comes with context
            instead of alarm.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <BmiCalculator />
        </Reveal>
      </div>
    </section>
  );
}
