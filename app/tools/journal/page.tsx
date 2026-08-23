import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import FloatingOrbs from "@/components/ui/FloatingOrbs";
import WorryJournal from "@/components/tools/WorryJournal";

export const metadata: Metadata = {
  title: "Worry journal",
  description:
    "A free, completely private worry journal — write out what's spiralling, then keep it on your device or let it go forever. Nothing ever leaves your browser.",
};

export default function JournalPage() {
  return (
    <section className="page-top relative overflow-hidden pb-24">
      <FloatingOrbs />
      <div className="wrap relative z-10">
        <Reveal className="mb-12 text-center">
          <p className="eyebrow mb-4 flex items-center justify-center gap-3">
            <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
            out of your head, onto the page
          </p>
          <h1 className="h-display text-4xl md:text-5xl">Put the worry down.</h1>
          <p className="mx-auto mt-5 max-w-lg leading-relaxed text-ink/70">
            A thought that circles at 2 a.m. loses half its weight the moment
            it&apos;s written out. Dump it here — then keep it to look at later,
            or let it go and watch it leave. Either way, it never leaves your
            device.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <WorryJournal />
        </Reveal>
      </div>
    </section>
  );
}
