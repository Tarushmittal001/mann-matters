import CountUp from "@/components/ui/CountUp";
import Reveal from "@/components/ui/Reveal";
import { stats } from "@/lib/site";

/* One colour and one mark per number, in palette order, so the strip reads
   as a spectrum left to right rather than four identical figures. */
const accents = [
  {
    c: "#0E9FA6",
    text: "#076166",
    icon: (
      <path
        d="M4 17.5V9.2a1 1 0 0 1 .5-.87l7-4.05a1 1 0 0 1 1 0l7 4.05a1 1 0 0 1 .5.87v8.3a1 1 0 0 1-.5.87l-7 4.05a1 1 0 0 1-1 0l-7-4.05a1 1 0 0 1-.5-.87Z"
        strokeLinejoin="round"
      />
    ),
  },
  {
    c: "#4356CE",
    text: "#2C3A9B",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6" strokeLinecap="round" />
      </>
    ),
  },
  {
    c: "#E14D7C",
    text: "#A82454",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.4" />
        <path d="M3.6 12h16.8M12 3.6c2.2 2.4 3.3 5.3 3.3 8.4S14.2 18 12 20.4c-2.2-2.4-3.3-5.3-3.3-8.4S9.8 6 12 3.6Z" />
      </>
    ),
  },
  {
    c: "#F0B429",
    text: "#8A5A00",
    icon: (
      <path
        d="m12 3.8 2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5 2.7.9-5.6-4-3.9 5.6-.8L12 3.8Z"
        strokeLinejoin="round"
      />
    ),
  },
];

export default function TrustStrip() {
  return (
    <section className="relative overflow-hidden border-y border-forest-800/10 bg-ivory-dark/70">
      <div className="mesh-warm pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <div className="rule-spectrum absolute inset-x-0 top-0 opacity-80" aria-hidden="true" />

      <div className="wrap-wide relative grid grid-cols-2 divide-forest-800/10 md:grid-cols-4 md:divide-x">
        {stats.map((s, i) => {
          const a = accents[i % accents.length];
          return (
            <Reveal
              key={s.label}
              delay={i * 0.08}
              className="group px-2 py-10 text-center md:py-14"
            >
              <span
                className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-2xl transition-transform duration-500 ease-silk group-hover:-translate-y-1 group-hover:rotate-6"
                style={{
                  background: `${a.c}1F`,
                  boxShadow: `0 8px 20px -10px ${a.c}`,
                }}
                aria-hidden="true"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={a.c}
                  strokeWidth="1.6"
                >
                  {a.icon}
                </svg>
              </span>

              <p className="font-display text-4xl font-medium md:text-5xl" style={{ color: a.text }}>
                <CountUp value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
              </p>
              <p className="mt-2 text-sm tracking-wide text-ink/60">{s.label}</p>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
