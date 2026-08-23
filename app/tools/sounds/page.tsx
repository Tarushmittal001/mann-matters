import type { Metadata } from "next";
import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import FloatingOrbs from "@/components/ui/FloatingOrbs";
import Soundscapes from "@/components/tools/Soundscapes";

export const metadata: Metadata = {
  title: "Calming sounds",
  description:
    "Free calming soundscapes — monsoon rain, a flowing river, a tanpura drone, hill wind. Generated live in your browser, nothing to download.",
};

export default function SoundsPage() {
  return (
    <section className="page-top relative overflow-hidden pb-24">
      <FloatingOrbs />
      {/* a faint wash of the hills behind the heading, dissolving into ivory */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[26rem]" aria-hidden="true">
        <Image
          src="/sounds/hill-wind.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%] opacity-25"
          style={{
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.9) 20%, rgba(0,0,0,0.4) 65%, transparent 96%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.9) 20%, rgba(0,0,0,0.4) 65%, transparent 96%)",
          }}
        />
      </div>
      <div className="wrap relative z-10">
        <Reveal className="mb-12 text-center">
          <p className="eyebrow mb-4 flex items-center justify-center gap-3">
            <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
            something to rest your ears on
          </p>
          <h1 className="h-display text-4xl md:text-5xl">Sounds to settle into.</h1>
          <p className="mx-auto mt-5 max-w-lg leading-relaxed text-ink/70">
            Pick one and let it run — while you work, wind down, or just sit for
            a while. Each sound is generated live in your browser, so nothing
            streams and nothing ever loops awkwardly.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <Soundscapes />
        </Reveal>
      </div>
    </section>
  );
}
