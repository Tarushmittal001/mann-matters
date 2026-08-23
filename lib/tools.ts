/**
 * The free-tool catalogue — one source for the /tools index and the rail on the
 * home page, so the two can never drift apart.
 *
 * `icon` is a key rather than a component so this stays a plain data module;
 * `TOOL_ICONS` in components/icons/ToolIcons.tsx resolves it.
 */

export type ToolIconKey =
  | "breath"
  | "grounding"
  | "relax"
  | "sounds"
  | "sleep"
  | "journal"
  | "affirmations"
  | "bmi"
  | "checkin";

export type Tool = {
  href: string;
  title: string;
  /** The one-line version, for the narrow cards on the home rail. */
  short: string;
  body: string;
  time: string;
  best: string;
  icon: ToolIconKey;
  /** optional watercolor peeking through the card background */
  art?: { src: string; pos: string };
};

export const tools: Tool[] = [
  {
    href: "/breathe",
    title: "Take a breath",
    short: "In for four, hold, out for four.",
    body: "Box breathing with a slowly growing orb — in for four, hold, out for four. The fastest way to tell your nervous system it's safe.",
    time: "1 min",
    best: "racing mind",
    icon: "breath",
  },
  {
    href: "/tools/grounding",
    title: "5-4-3-2-1 grounding",
    short: "Anchor yourself with your senses.",
    body: "Anchor yourself with your senses — five things you see, four you feel, three you hear, two you smell, one you taste.",
    time: "3 min",
    best: "anxiety & panic",
    icon: "grounding",
  },
  {
    href: "/tools/relax",
    title: "Muscle relaxation",
    short: "Tense and release, hands to feet.",
    body: "Tense and release nine muscle groups, hands to feet. Stress hides in the body — this is how you find it and let it go.",
    time: "3 min",
    best: "tension & stress",
    icon: "relax",
  },
  {
    href: "/tools/sounds",
    title: "Calming sounds",
    short: "Monsoon rain, a river, a tanpura drone.",
    body: "Monsoon rain, a flowing river, a tanpura drone, hill wind — mix them together, set a fade-out timer, drift off.",
    time: "as long as you like",
    best: "focus & sleep",
    icon: "sounds",
    art: { src: "/sounds/monsoon-rain.png", pos: "object-[center_30%]" },
  },
  {
    href: "/tools/sleep",
    title: "Sleep wind-down",
    short: "A slow body scan, toes to head.",
    body: "A slow guided body scan from your toes to the top of your head, until the whole body is too heavy to keep worrying with.",
    time: "5 min",
    best: "can't sleep",
    icon: "sleep",
  },
  {
    href: "/tools/journal",
    title: "Worry journal",
    short: "Write it out, then let it go.",
    body: "Write out what's spiralling — then keep it on your device, or let it go and watch it leave. Nothing ever leaves your browser.",
    time: "as long as you need",
    best: "a full head",
    icon: "journal",
  },
  {
    href: "/tools/affirmations",
    title: "Affirmations",
    short: "Small true things, हिंदी + English.",
    body: "Small, true things in Hindi and English. Read one slowly, keep the one that fits today.",
    time: "1 min",
    best: "heavy days",
    icon: "affirmations",
  },
  {
    href: "/tools/bmi",
    title: "BMI calculator",
    short: "A number in context, never a verdict.",
    body: "A rough first-glance number with WHO Asian-population cutoffs and context instead of alarm. A number, never a verdict.",
    time: "1 min",
    best: "a quick check",
    icon: "bmi",
  },
  {
    href: "/check-in",
    title: "Mood check-in",
    short: "Four questions, one kind reflection.",
    body: "Four gentle questions and a kind reflection on how you've really been. No scores to fear, never a diagnosis.",
    time: "2 min",
    best: "not sure how you feel",
    icon: "checkin",
  },
];

/** The tools that already run inline on the home page, so the rail can skip them. */
export const inlineOnHome = ["/breathe", "/check-in"];

export const railTools = tools.filter((t) => !inlineOnHome.includes(t.href));
