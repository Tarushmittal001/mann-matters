"use client";

import { useState } from "react";

/**
 * Review portrait.
 *  - If `src` is given and loads, shows that watercolor image (/public/reviews).
 *  - Otherwise renders a soft watercolor *figure* (head & shoulders, faceless,
 *    on-brand) so there is always a human illustration — never a letter monogram.
 */

type Palette = {
  hair: string;
  hairLight: string;
  skin: string;
  cloth: string;
  clothLight: string;
};

const palettes: Palette[] = [
  { hair: "#0A2E28", hairLight: "#247261", skin: "#E8C9A6", cloth: "#13483E", clothLight: "#A8C3B5" },
  { hair: "#3D2B1F", hairLight: "#A98943", skin: "#D9AE84", cloth: "#C8A45D", clothLight: "#EFEAE0" },
  { hair: "#06211C", hairLight: "#1A5A4D", skin: "#E0BC97", cloth: "#0E3B33", clothLight: "#C8A45D" },
  { hair: "#2C1810", hairLight: "#86A593", skin: "#D2A679", cloth: "#247261", clothLight: "#DCC28C" },
  { hair: "#1A1A14", hairLight: "#A98943", skin: "#E5C4A0", cloth: "#1A5A4D", clothLight: "#A8C3B5" },
  { hair: "#2C1810", hairLight: "#13483E", skin: "#D8AE85", cloth: "#A98943", clothLight: "#D9E6DE" },
];

/* Head: ellipse cx60 cy56 rx23 ry27.  One hair silhouette per index. */
function HairBust({ p, variant }: { p: Palette; variant: number }) {
  switch (variant % 6) {
    case 0: // high ponytail
      return (
        <>
          <path d="M82 40 C98 44 100 78 88 96 C84 82 80 66 74 56 Z" fill={p.hairLight} />
          <path d="M37 44 C33 28 46 18 60 18 C76 18 90 30 86 46 C76 32 46 32 37 44 Z" fill={p.hair} />
          <path d="M40 42 C44 26 76 26 80 42 C70 32 50 32 40 42 Z" fill={p.hairLight} opacity="0.45" />
        </>
      );
    case 1: // low bun
      return (
        <>
          <ellipse cx="86" cy="34" rx="11" ry="11" fill={p.hairLight} />
          <path d="M35 46 C31 26 48 16 60 16 C74 16 89 28 85 48 C74 32 48 32 35 46 Z" fill={p.hair} />
          <path d="M40 42 C46 26 74 26 80 42 C70 32 50 32 40 42 Z" fill={p.hairLight} opacity="0.4" />
        </>
      );
    case 2: // long flowing
      return (
        <>
          <path d="M34 40 C26 64 28 92 36 108 C40 86 40 64 44 48 Z" fill={p.hair} />
          <path d="M86 40 C94 64 92 92 84 108 C80 86 80 64 76 48 Z" fill={p.hair} />
          <path d="M34 44 C30 26 50 16 60 16 C72 16 90 26 86 44 C76 30 46 30 34 44 Z" fill={p.hair} />
          <path d="M40 40 C46 24 74 24 80 40 C70 30 50 30 40 40 Z" fill={p.hairLight} opacity="0.4" />
        </>
      );
    case 3: // short / cropped
      return (
        <>
          <path d="M35 52 C31 30 46 18 60 18 C74 18 89 30 85 52 C80 38 72 32 60 32 C48 32 40 38 35 52 Z" fill={p.hair} />
          <path d="M60 18 C74 18 84 28 85 44 C76 32 66 32 60 32 Z" fill={p.hairLight} opacity="0.45" />
        </>
      );
    case 4: // side-swept bob
      return (
        <>
          <path d="M34 50 C30 28 48 18 62 18 C78 18 88 30 86 50 C80 36 66 32 56 34 C46 36 40 42 34 56 Z" fill={p.hair} />
          <path d="M86 50 C90 70 86 86 78 96 C76 78 78 62 74 50 Z" fill={p.hairLight} />
        </>
      );
    default: // wavy shoulder-length
      return (
        <>
          <path d="M35 44 C27 64 30 84 38 96 C40 78 40 60 45 46 Z" fill={p.hair} />
          <path d="M85 44 C93 64 90 84 82 96 C80 78 80 60 75 46 Z" fill={p.hair} />
          <path d="M36 44 C32 26 50 16 60 16 C72 16 88 26 84 44 C74 30 46 30 36 44 Z" fill={p.hair} />
          <path d="M41 40 C47 24 73 24 79 40 C69 30 51 30 41 40 Z" fill={p.hairLight} opacity="0.4" />
        </>
      );
  }
}

function WatercolorBust({ name, index }: { name: string; index: number }) {
  const p = palettes[index % palettes.length];
  const uid = `bust${index}`;
  return (
    <svg
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={name}
      className="h-full w-full"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <linearGradient id={`${uid}-cloth`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.clothLight} />
          <stop offset="100%" stopColor={p.cloth} />
        </linearGradient>
        {/* soft pigment bleed + paper grain (no displacement map — keeps paint cheap) */}
        <filter id={`${uid}-wc`} x="-18%" y="-18%" width="136%" height="136%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.2" result="bleed" />
          <feComponentTransfer in="bleed" result="bleedfade">
            <feFuncA type="linear" slope="0.55" />
          </feComponentTransfer>
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed={index + 5} result="grain" />
          <feColorMatrix in="grain" type="saturate" values="0" result="grainm" />
          <feComponentTransfer in="grainm" result="grainfade">
            <feFuncA type="linear" slope="0.07" />
          </feComponentTransfer>
          <feComposite in="grainfade" in2="SourceGraphic" operator="in" result="tex" />
          <feMerge>
            <feMergeNode in="bleedfade" />
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="tex" />
          </feMerge>
        </filter>
      </defs>

      <g filter={`url(#${uid}-wc)`}>
        <path d="M18 140 C18 108 36 92 60 92 C84 92 102 108 102 140 Z" fill={`url(#${uid}-cloth)`} />
        <path d="M60 92 C76 92 88 100 95 114 C84 104 70 102 60 102 Z" fill={p.clothLight} opacity="0.35" />
        <path d="M50 86 C50 95 70 95 70 86 L70 74 L50 74 Z" fill={p.skin} />
        <path d="M50 86 C56 90 64 90 70 86 L70 81 C64 84 56 84 50 81 Z" fill="#000" opacity="0.07" />
        <ellipse cx="60" cy="56" rx="23" ry="27" fill={p.skin} />
        <ellipse cx="50" cy="58" rx="9" ry="13" fill="#fff" opacity="0.10" />
        <ellipse cx="71" cy="62" rx="7" ry="11" fill="#000" opacity="0.05" />
        <HairBust p={p} variant={index} />

        {/* soft facial features — kept minimal and painterly */}
        <ellipse cx="51.5" cy="55" rx="3.6" ry="2.4" fill="#C8A45D" opacity="0.16" />
        <ellipse cx="68.5" cy="55" rx="3.6" ry="2.4" fill="#C8A45D" opacity="0.16" />
        <g opacity="0.72">
          <ellipse cx="52" cy="53.5" rx="1.7" ry="2.3" fill={p.hair} />
          <ellipse cx="68" cy="53.5" rx="1.7" ry="2.3" fill={p.hair} />
          <path d="M54 64 Q60 68.5 66 64" stroke={p.hair} strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>
      </g>
    </svg>
  );
}

export default function Avatar({
  name,
  src,
  index = 0,
}: {
  name: string;
  src?: string;
  index?: number;
  size?: number;
  mode?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className="h-full w-full object-contain object-bottom"
      />
    );
  }

  return <WatercolorBust name={name} index={index} />;
}
