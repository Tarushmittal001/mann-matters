import { cn } from "@/lib/utils";

/**
 * Decorative echo of the hero's 3D language — soft blurred spheres that
 * drift slowly. One per accent colour, so a section picks up the whole
 * family without any of it being loud. Pure CSS, hidden from screen readers.
 */
const ORBS = [
  { c: "#F0B429", pos: "left-[8%] top-[18%] h-24 w-24", anim: "animate-drift-slow", delay: "0s" },
  { c: "#8490EC", pos: "right-[10%] top-[52%] h-16 w-16", anim: "animate-breathe", delay: "-3s" },
  { c: "#0E9FA6", pos: "bottom-[12%] left-[28%] h-20 w-20", anim: "animate-drift-slow", delay: "-6s" },
  { c: "#4356CE", pos: "right-[26%] top-[12%] h-12 w-12", anim: "animate-bob-soft", delay: "-2s" },
  { c: "#E36A3B", pos: "bottom-[24%] right-[6%] h-14 w-14", anim: "animate-breathe", delay: "-8s" },
];

export default function FloatingOrbs({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      {ORBS.map((o, i) => (
        <span
          key={i}
          className={cn("absolute rounded-full blur-xl", o.pos, o.anim)}
          style={{
            background: `radial-gradient(circle at 34% 30%, ${o.c}, transparent 70%)`,
            opacity: 0.55,
            animationDelay: o.delay,
          }}
        />
      ))}
    </div>
  );
}
