import { cn } from "@/lib/utils";

/**
 * The seam between two sections, drawn rather than left as a hard edge.
 * `fill` is the colour of the section *below*; a spectrum arc rides the
 * same curve so the join picks up a thread of the accent family.
 */
export default function WaveDivider({
  fill = "#F7F4EE",
  flip = false,
  className,
}: {
  fill?: string;
  flip?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("relative w-full leading-[0]", flip && "rotate-180", className)}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 96"
        preserveAspectRatio="none"
        className="block h-[52px] w-full md:h-[84px]"
      >
        <defs>
          <linearGradient id="wave-arc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F0B429" />
            <stop offset="25%" stopColor="#E36A3B" />
            <stop offset="50%" stopColor="#E14D7C" />
            <stop offset="75%" stopColor="#7C4D9B" />
            <stop offset="100%" stopColor="#0E9FA6" />
          </linearGradient>
        </defs>
        <path
          d="M0 44 C 240 96, 480 0, 720 30 C 960 60, 1200 96, 1440 52 L1440 97 L0 97 Z"
          fill={fill}
        />
        <path
          d="M0 44 C 240 96, 480 0, 720 30 C 960 60, 1200 96, 1440 52"
          fill="none"
          stroke="url(#wave-arc)"
          strokeWidth="2.5"
          strokeOpacity="0.75"
        />
      </svg>
    </div>
  );
}
