import Image from "next/image";
import type { Post } from "@/lib/posts";

/**
 * The cover: a real photograph with the article's Devanagari word set across it.
 *
 * The photo stays essentially sharp — only a 1px softening so it reads as
 * ground rather than subject. Legibility comes from two scrims instead of a
 * full-frame wash: a heavy one at the bottom where the word sits, and a light
 * one at the top under the masthead. The middle of the frame is left alone, so
 * you can actually see the picture.
 */

type Palette = {
  /** Bottom scrim, top scrim and a thin overall tint, composited in that order. */
  scrim: string;
  ink: string;
  accent: string;
  devaOpacity: number;
};

/** base = the colour both scrims are made of; tint = the brand wash over the photo. */
function scrimFor(base: string, tint: string, bottom: number, top: number, wash: number) {
  return [
    "linear-gradient(to top, rgba(" + base + "," + bottom + ") 0%, rgba(" + base + "," + (bottom * 0.62).toFixed(2) + ") 24%, rgba(" + base + ",0) 56%)",
    "linear-gradient(to bottom, rgba(" + base + "," + top + ") 0%, rgba(" + base + ",0) 24%)",
    "linear-gradient(0deg, rgba(" + tint + "," + wash + "), rgba(" + tint + "," + wash + "))",
  ].join(", ");
}

const PALETTES: Record<Post["category"], Palette> = {
  Anxiety: {
    scrim: scrimFor("6,33,28", "10,46,40", 0.93, 0.58, 0.24),
    ink: "#EDF3EF",
    accent: "#C8A45D",
    devaOpacity: 0.3,
  },
  Relationships: {
    scrim: scrimFor("14,59,51", "20,74,63", 0.92, 0.56, 0.22),
    ink: "#FCFAF6",
    accent: "#DCC28C",
    devaOpacity: 0.3,
  },
  "Student Life": {
    scrim: scrimFor("247,244,238", "217,230,222", 0.94, 0.62, 0.22),
    ink: "#0E3B33",
    accent: "#A98943",
    devaOpacity: 0.26,
  },
  Workplace: {
    scrim: scrimFor("10,46,40", "31,45,40", 0.93, 0.58, 0.24),
    ink: "#EDF3EF",
    accent: "#C8A45D",
    devaOpacity: 0.3,
  },
  "Self-care": {
    scrim: scrimFor("237,243,239", "200,222,210", 0.94, 0.62, 0.22),
    ink: "#0A2E28",
    accent: "#A98943",
    devaOpacity: 0.26,
  },
};

export default function PostCover({
  post,
  className,
  sizes = "(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw",
  eager = false,
}: {
  post: Post;
  className?: string;
  sizes?: string;
  eager?: boolean;
}) {
  const p = PALETTES[post.category];

  return (
    <div className={"relative overflow-hidden " + (className ?? "")}>
      <Image
        src={post.cover}
        alt={post.coverAlt}
        fill
        priority={eager}
        sizes={sizes}
        className="object-cover"
        /* barely softened, and scaled a touch so the blur has no edge to bleed at */
        style={{ filter: "blur(1px)", transform: "scale(1.03)" }}
      />

      <div className="absolute inset-0" style={{ background: p.scrim }} aria-hidden="true" />

      <svg
        viewBox="0 0 1600 1000"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {/* the word */}
        <text x="52" y="1010" className="font-deva" fontSize="440" fill={p.ink} opacity={p.devaOpacity}>
          {post.deva}
        </text>

        {/* category, set like a masthead */}
        <text x="60" y="112" fontSize="34" letterSpacing="7" fill={p.ink} opacity="0.8" className="font-sans">
          {post.category.toUpperCase()}
        </text>
        <rect x="60" y="146" width="86" height="5" fill={p.accent} />
      </svg>
    </div>
  );
}
