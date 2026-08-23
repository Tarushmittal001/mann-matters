import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import FloatingOrbs from "@/components/ui/FloatingOrbs";
import { site } from "@/lib/site";

export default function CTABand() {
  return (
    <section className="relative overflow-hidden bg-forest-950 py-24 md:py-32">
      {/* the page's loudest colour, saved for the last thing you read */}
      <div className="mesh-cool pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 82% 18%, rgba(67,86,206,0.38), transparent 66%), radial-gradient(ellipse 60% 50% at 8% 92%, rgba(240,180,41,0.28), transparent 68%)",
        }}
      />

      {/* मन — the brand watermark, vast and quiet */}
      <span
        className="pointer-events-none absolute -right-10 top-1/2 -translate-y-1/2 select-none font-deva text-[22rem] leading-none text-ivory/[0.05] md:text-[34rem]"
        aria-hidden="true"
      >
        मन
      </span>
      <FloatingOrbs className="opacity-60" />

      <div className="wrap-wide relative z-10 max-w-3xl">
        <Reveal>
          <p className="eyebrow mb-5 flex items-center gap-3 !text-haldi">
            <span className="font-deva normal-case tracking-normal text-gulaal-light" aria-hidden="true">
              मन
            </span>
            whenever you&apos;re ready
          </p>
          <h2 className="h-display text-5xl text-ivory md:text-[4.5rem]">
            Begin your journey.
            <br />
            <span className="text-sunrise italic">Gently.</span>
          </h2>
          <span className="rule-spectrum mt-6 w-28" aria-hidden="true" />
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-ivory/75">
            The first session is just a conversation. No commitment, no
            diagnosis on day one, no one else needs to know. Fifty minutes
            that are entirely yours.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="/book" variant="sunrise">
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
