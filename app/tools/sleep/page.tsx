import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import SleepWindDown from "@/components/tools/SleepWindDown";

export const metadata: Metadata = {
  title: "Sleep wind-down",
  description:
    "A free five-minute guided body scan for bedtime — from your toes to the top of your head, until the whole body is heavy enough to drift.",
};

export default function SleepPage() {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-forest-950 text-ivory">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 50% 40%, rgba(168,195,181,0.13), transparent 70%)",
        }}
      />
      <div className="wrap relative z-10 flex flex-col items-center py-28 text-center">
        <Reveal>
          <p className="eyebrow mb-4 text-sage">
            <span className="font-deva normal-case tracking-normal text-gold" aria-hidden="true">मन</span> lights low, day done
          </p>
          <h1 className="h-display text-4xl text-ivory md:text-5xl">Let the day end.</h1>
          <p className="mx-auto mt-5 max-w-md leading-relaxed text-sage-light/80">
            A slow body scan from your toes to the top of your head. By the last
            step, your body should feel too heavy to keep worrying with.
          </p>
        </Reveal>
        <Reveal delay={0.15} className="mt-12 w-full">
          <SleepWindDown />
        </Reveal>
      </div>
    </section>
  );
}
