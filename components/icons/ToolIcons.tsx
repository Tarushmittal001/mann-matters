/**
 * Bespoke duotone emblems for the free tools — small objects from the
 * everyday Indian world of a heavy day, not stock UI glyphs. Every emblem
 * follows the same recipe: a forest line drawing on a 48px grid, a soft sage
 * gradient fill, and exactly one gold accent — the spark of मन.
 *
 * Pure SVG, server-component safe.
 */

type IconProps = { size?: number; className?: string };

const FOREST = "#13483E";
const FOREST_DEEP = "#0E3B33";
const SAGE = "#A8C3B5";
const SAGE_DARK = "#86A593";
const SAGE_LIGHT = "#D9E6DE";
const GOLD = "#C8A45D";
const GOLD_LIGHT = "#DCC28C";
const IVORY = "#FCFAF6";

/** The breathing orb itself, mid-exhale, with ripples of breath. */
export function BreathIcon({ size = 38, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="emoraa-breath-orb" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={SAGE_LIGHT} />
          <stop offset="55%" stopColor={SAGE} />
          <stop offset="100%" stopColor="#247261" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="13.5" stroke={FOREST} strokeWidth="1.4" opacity="0.5" pathLength="100" strokeDasharray="86 14" strokeLinecap="round" transform="rotate(24 24 24)" />
      <circle cx="24" cy="24" r="18" stroke={FOREST} strokeWidth="1.3" opacity="0.28" pathLength="100" strokeDasharray="78 22" strokeLinecap="round" transform="rotate(150 24 24)" />
      <circle cx="24" cy="24" r="22" stroke={FOREST} strokeWidth="1.2" opacity="0.14" pathLength="100" strokeDasharray="70 30" strokeLinecap="round" transform="rotate(266 24 24)" />
      <circle cx="24" cy="24" r="8.2" fill="url(#emoraa-breath-orb)" />
      <circle cx="32.7" cy="13.7" r="2" fill={GOLD} />
    </svg>
  );
}

/** A lotus with five petals — one for each sense in 5-4-3-2-1. */
export function GroundingIcon({ size = 38, className }: IconProps) {
  const petal =
    "M24 13.5 C27.8 18.5 28.8 25 24 33 C19.2 25 20.2 18.5 24 13.5 Z";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="mm-lotus-petal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SAGE_LIGHT} />
          <stop offset="100%" stopColor={SAGE} />
        </linearGradient>
      </defs>
      <path d={petal} fill="url(#mm-lotus-petal)" stroke={FOREST} strokeWidth="1.2" opacity="0.5" transform="rotate(-52 24 33)" />
      <path d={petal} fill="url(#mm-lotus-petal)" stroke={FOREST} strokeWidth="1.2" opacity="0.5" transform="rotate(52 24 33)" />
      <path d={petal} fill="url(#mm-lotus-petal)" stroke={FOREST} strokeWidth="1.2" opacity="0.78" transform="rotate(-26 24 33)" />
      <path d={petal} fill="url(#mm-lotus-petal)" stroke={FOREST} strokeWidth="1.2" opacity="0.78" transform="rotate(26 24 33)" />
      <path d={petal} fill="url(#mm-lotus-petal)" stroke={FOREST} strokeWidth="1.2" />
      <path d="M13 40.5 Q24 44.5 35 40.5" stroke={SAGE_DARK} strokeWidth="1.3" strokeLinecap="round" opacity="0.7" fill="none" />
      <circle cx="24" cy="36.6" r="2.3" fill={GOLD} />
    </svg>
  );
}

/** The knot in your shoulders, unwinding into a long slow exhale. */
export function RelaxIcon({ size = 38, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M17 25 A2.1 2.1 0 0 1 21.2 25 A4 4 0 0 1 13.2 25 A6 6 0 0 1 25.2 25 C25.2 30.2 21.5 32.8 26.3 32.8 C31.1 32.8 32.6 28.4 36.4 28.4 C38.5 28.4 39.4 29.4 40.6 30.4"
        stroke={FOREST}
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M30 20.5 Q33.5 18 37.5 19.5" stroke={SAGE_DARK} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" fill="none" />
      <circle cx="41.3" cy="30.9" r="2.1" fill={GOLD} />
    </svg>
  );
}

/** A tanpura, still humming — the drone you can lean your mind on. */
export function SoundsIcon({ size = 38, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="mm-tanpura-gourd" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor={SAGE_LIGHT} />
          <stop offset="100%" stopColor={SAGE} />
        </radialGradient>
      </defs>
      <path d="M18.7 28 L18.7 10.2 Q18.7 8.2 20 8.2 Q21.3 8.2 21.3 10.2 L21.3 28" fill={IVORY} stroke={FOREST} strokeWidth="1.3" />
      <circle cx="20" cy="34" r="7.6" fill="url(#mm-tanpura-gourd)" stroke={FOREST} strokeWidth="1.3" />
      <path d="M16.8 34.6 L23.2 34.6" stroke={FOREST} strokeWidth="1" opacity="0.55" />
      <circle cx="16" cy="10.6" r="1.4" fill={IVORY} stroke={FOREST} strokeWidth="1.1" />
      <circle cx="24" cy="13.4" r="1.4" fill={IVORY} stroke={FOREST} strokeWidth="1.1" />
      <path d="M20 10.5 L20 38.2" stroke={GOLD} strokeWidth="1.15" strokeLinecap="round" />
      <path d="M31.5 27.5 Q35 34 31.5 40.5" stroke={SAGE_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.85" fill="none" />
      <path d="M36 25.5 Q40.5 34 36 42.5" stroke={SAGE_DARK} strokeWidth="1.4" strokeLinecap="round" opacity="0.45" fill="none" />
    </svg>
  );
}

/** A crescent moon holding one gold star — the day, ending. */
export function SleepIcon({ size = 38, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="mm-moon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={SAGE_LIGHT} />
          <stop offset="100%" stopColor={SAGE} />
        </linearGradient>
      </defs>
      <path
        d="M28 11 A13 13 0 1 0 39.5 29.5 A11 11 0 0 1 28 11 Z"
        fill="url(#mm-moon)"
        stroke={FOREST}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M35 10.8 C35.55 13.1 36.4 13.95 38.7 14.5 C36.4 15.05 35.55 15.9 35 18.2 C34.45 15.9 33.6 15.05 31.3 14.5 C33.6 13.95 34.45 13.1 35 10.8 Z" fill={GOLD} />
      <circle cx="41.2" cy="21.5" r="1.15" fill={SAGE_DARK} />
    </svg>
  );
}

/** A paper boat — write the worry down, fold it, let the water take it. */
export function JournalIcon({ size = 38, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="mm-boat-hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SAGE_LIGHT} />
          <stop offset="100%" stopColor={SAGE} />
        </linearGradient>
      </defs>
      <path d="M24 13 L29.8 25.5 L18.2 25.5 Z" fill={IVORY} stroke={FOREST} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M24 17 L24 25.5" stroke={FOREST} strokeWidth="1" opacity="0.35" />
      <path d="M24 13 L26 17.3 L22 17.3 Z" fill={GOLD} stroke={GOLD} strokeWidth="0.6" strokeLinejoin="round" />
      <path d="M8 25.5 L40 25.5 L31 34.5 L17 34.5 Z" fill="url(#mm-boat-hull)" stroke={FOREST} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M7.5 39.5 Q11.5 37.2 15.5 39.5 T23.5 39.5 T31.5 39.5 T39.5 39.5" stroke={SAGE_DARK} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" fill="none" />
    </svg>
  );
}

/** A diya — one small true light, kept burning. */
export function AffirmationsIcon({ size = 38, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="mm-diya-bowl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={FOREST} />
          <stop offset="100%" stopColor="#0A2E28" />
        </linearGradient>
        <radialGradient id="mm-diya-flame" cx="50%" cy="62%" r="70%">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="100%" stopColor={GOLD} />
        </radialGradient>
      </defs>
      <circle cx="24" cy="20.5" r="8" fill={GOLD} opacity="0.14" />
      <path d="M24 13 C27.6 18 29 21.5 24 26.5 C19 21.5 20.4 18 24 13 Z" fill="url(#mm-diya-flame)" />
      <path d="M24 20.8 C25.1 22.2 25.3 23.1 24 24.6 C22.7 23.1 22.9 22.2 24 20.8 Z" fill={IVORY} opacity="0.9" />
      <path d="M11.5 28.5 Q13 38.5 24 38.5 Q35 38.5 36.5 28.5 Q30 31 24 31 Q18 31 11.5 28.5 Z" fill="url(#mm-diya-bowl)" stroke={FOREST_DEEP} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M13.5 29.3 Q18.7 31.2 24 31.2 Q29.3 31.2 34.5 29.3" stroke={SAGE} strokeWidth="1" strokeLinecap="round" opacity="0.5" fill="none" />
    </svg>
  );
}

/** A kulhad of chai, still steaming — sit down, how are you, really? */
export function CheckInIcon({ size = 38, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="mm-chai-cup" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SAGE_LIGHT} />
          <stop offset="100%" stopColor={SAGE} />
        </linearGradient>
      </defs>
      <path d="M15.5 21.5 L18 35.8 Q18.3 37.5 20 37.5 L28 37.5 Q29.7 37.5 30 35.8 L32.5 21.5 Z" fill="url(#mm-chai-cup)" stroke={FOREST} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M15.5 21.5 L32.5 21.5" stroke={FOREST} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M16.4 25 L31.6 25" stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" opacity="0.9" />
      <path d="M20.8 16.5 C19.4 14.3 21.8 12.8 20.8 10.2" stroke={SAGE_DARK} strokeWidth="1.4" strokeLinecap="round" opacity="0.75" fill="none" />
      <path d="M27.2 16.5 C25.8 14.3 28.2 12.8 27.2 10.2" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** A tarazu at rest — level, unhurried, weighing without judging. */
export function BmiIcon({ size = 38, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="mm-tarazu-pan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SAGE_LIGHT} />
          <stop offset="100%" stopColor={SAGE} />
        </linearGradient>
      </defs>
      <path d="M24 11 L24 15" stroke={FOREST} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 15 L37 15" stroke={FOREST} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M11 15.5 L7.5 26 M11 15.5 L14.5 26" stroke={FOREST} strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
      <path d="M37 15.5 L33.5 26 M37 15.5 L40.5 26" stroke={FOREST} strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
      <path d="M5.5 26 Q11 32 16.5 26 Z" fill="url(#mm-tarazu-pan)" stroke={FOREST} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M31.5 26 Q37 32 42.5 26 Z" fill="url(#mm-tarazu-pan)" stroke={FOREST} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M24 36 L24 39.5 M20 39.5 L28 39.5" stroke={SAGE_DARK} strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
      <path d="M24 15 L24 36" stroke={FOREST} strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
      <circle cx="24" cy="10" r="2.2" fill={GOLD} />
    </svg>
  );
}

/** Two circles finding their overlap — you, and someone who fits. */
export function MatchIcon({ size = 38, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="mm-match-lens" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="100%" stopColor={GOLD} />
        </linearGradient>
      </defs>
      <path d="M24 16.8 A8.5 8.5 0 0 1 24 31.2 A8.5 8.5 0 0 1 24 16.8 Z" fill="url(#mm-match-lens)" opacity="0.9" />
      <circle cx="19.5" cy="24" r="8.5" stroke={FOREST} strokeWidth="1.5" />
      <circle cx="28.5" cy="24" r="8.5" stroke={FOREST} strokeWidth="1.5" opacity="0.6" />
    </svg>
  );
}

/** Resolves a tool's `icon` key from lib/tools.ts to its emblem. */
export const TOOL_ICONS = {
  breath: BreathIcon,
  grounding: GroundingIcon,
  relax: RelaxIcon,
  sounds: SoundsIcon,
  sleep: SleepIcon,
  journal: JournalIcon,
  affirmations: AffirmationsIcon,
  bmi: BmiIcon,
  checkin: CheckInIcon,
  match: MatchIcon,
} as const;

/**
 * The aura disc every emblem sits on: a soft sage radial glow that warms to
 * gold when the parent (a `group` card) is hovered.
 */
export function ToolEmblem({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-flex h-16 w-16 shrink-0 items-center justify-center">
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, #E3EDE8, rgba(217,230,222,0.5) 55%, rgba(217,230,222,0) 76%)",
        }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 ease-silk group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, rgba(220,194,140,0.55), rgba(200,164,93,0.2) 55%, rgba(200,164,93,0) 76%)",
        }}
      />
      <span className="relative transition-transform duration-500 ease-silk group-hover:scale-[1.07]">
        {children}
      </span>
    </span>
  );
}
