import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import FloatingOrbs from "@/components/ui/FloatingOrbs";
import { site } from "@/lib/site";

export default function CTABand() {
  return (
    <section className="relative overflow-hidden bg-forest-900 py-24 md:py-32">
      {/* मन — the brand watermark, vast and quiet */}
      <span
        className="pointer-events-none absolute -right-10 top-1/2 -translate-y-1/2 select-none font-deva text-[22rem] leading-none text-ivory/[0.04] md:text-[34rem]"
        aria-hidden="true"
      >
        मन
      </span>
      <FloatingOrbs className="opacity-50" />

      <div className="wrap-wide relative z-10 max-w-3xl">
        <Reveal>
          <p className="eyebrow mb-5 text-sage">
            <span className="font-deva normal-case tracking-normal text-gold" aria-hidden="true">मन</span>{" "}
            whenever you&apos;re ready
          </p>
          <h2 className="h-display text-5xl text-ivory md:text-[4.5rem]">
            Begin your journey.
            <br />
            <span className="italic text-sage">Gently.</span>
          </h2>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-sage-light/80">
            The first session is just a conversation. No commitment, no
            diagnosis on day one, no one else needs to know. Fifty minutes
            that are entirely yours.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="/book" variant="gold">
              Book a session
            </Button>
            <Button href={site.whatsapp} external variant="outline-light">
              Ask us anything first
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
