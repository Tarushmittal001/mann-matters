import CountUp from "@/components/ui/CountUp";
import Reveal from "@/components/ui/Reveal";
import { stats } from "@/lib/site";

export default function TrustStrip() {
  return (
    <section className="border-y border-forest-800/10 bg-ivory-dark/60">
      <div className="wrap-wide grid grid-cols-2 divide-forest-800/10 md:grid-cols-4 md:divide-x">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} className="px-2 py-10 text-center md:py-14">
            <p className="font-display text-4xl font-medium text-forest-900 md:text-5xl">
              <CountUp value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
            </p>
            <p className="mt-2 text-sm tracking-wide text-ink/60">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
