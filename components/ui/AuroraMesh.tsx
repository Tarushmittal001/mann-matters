import { cn } from "@/lib/utils";

/**
 * Six coloured lights behind the page, drifting on long offset loops.
 * Blur does the blending, so no edge ever resolves into a shape — it reads
 * as atmosphere rather than as graphics.
 *
 * Deliberately warm-and-cool with no pink or plum: at this blur radius those
 * two spread into a wash that tints the whole page rather than lighting it.
 */
const BLOBS = [
  { c: "#F0B429", pos: "left-[-6%] top-[-8%] h-[34vw] w-[34vw]" },
  { c: "#E36A3B", pos: "left-[22%] top-[46%] h-[26vw] w-[26vw]" },
  { c: "#FBD871", pos: "right-[-4%] top-[6%] h-[30vw] w-[30vw]" },
  { c: "#247261", pos: "bottom-[-6%] right-[18%] h-[22vw] w-[22vw]" },
  { c: "#0E9FA6", pos: "bottom-[-10%] left-[6%] h-[28vw] w-[28vw]" },
  { c: "#4356CE", pos: "right-[38%] top-[30%] h-[20vw] w-[20vw]" },
];

export default function AuroraMesh({
  className,
  intensity = 0.4,
}: {
  className?: string;
  intensity?: number;
}) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      {BLOBS.map((b, i) => (
        <span
          key={i}
          className={cn(
            "absolute animate-mesh-drift rounded-full blur-[70px] will-change-transform",
            b.pos
          )}
          style={{
            background: `radial-gradient(circle at 38% 32%, ${b.c}, transparent 68%)`,
            opacity: intensity,
            animationDelay: `${i * -3.4}s`,
            animationDuration: `${18 + i * 2.5}s`,
          }}
        />
      ))}
    </div>
  );
}
