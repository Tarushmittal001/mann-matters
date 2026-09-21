import { concernMap, rank, type Concern } from "@/lib/matching";
import { services, type Service } from "@/lib/services";
import type { Expert } from "@/lib/experts";

/**
 * The self-check behind the "Which of these do I need?" button on /services.
 *
 * Three published, validated screeners rather than questions we invented:
 *
 *   • **GAD-7** — anxiety. Spitzer et al., 2006.
 *   • **PHQ-8** — low mood. Kroenke et al., 2009.
 *   • **PSS-4** — perceived stress. Cohen & Williamson, 1988.
 *
 * All three are free to use and are what a clinician would actually reach for,
 * so the percentage someone sees here means something when they repeat it in a
 * session. Made-up questions would produce a number that looks precise and says
 * nothing.
 *
 * **PHQ-8, not PHQ-9, on purpose.** The ninth item of the PHQ-9 asks about
 * thoughts of self-harm. It is the right question in a room with a clinician in
 * it, and the wrong one on a marketing page at 2 a.m. with nobody watching the
 * answer. PHQ-8 is separately validated without it. The crisis line is shown on
 * the result regardless of score, and prominently when scores are high.
 *
 * This is a screener, not a diagnosis, and the result says so. Its job is to
 * narrow ten services down to one sensible starting point.
 *
 * Privacy: every function here is pure. Answers are held in component state,
 * are never written to storage, and never leave the device.
 */

export type Choice = { label: string; value: number };

/** How often, over the last two weeks — the standard PHQ/GAD response set. */
export const FREQUENCY: Choice[] = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
];

/** How often, in the last month — the PSS response set. */
export const HOW_OFTEN: Choice[] = [
  { label: "Never", value: 0 },
  { label: "Almost never", value: 1 },
  { label: "Sometimes", value: 2 },
  { label: "Fairly often", value: 3 },
  { label: "Very often", value: 4 },
];

export type ScaleId = "anxiety" | "mood" | "stress";

export type Scale = {
  id: ScaleId;
  /** Shown as the step heading. */
  title: string;
  /** The stem every item completes. */
  stem: string;
  source: string;
  choices: Choice[];
  items: string[];
  /** Items scored in reverse — the PSS asks two of its four positively. */
  reversed?: number[];
  /** Cut-offs, ascending. Each entry starts at `from` and runs to the next. */
  bands: { from: number; label: string; note: string }[];
};

export const SCALES: Scale[] = [
  {
    id: "anxiety",
    title: "Worry",
    stem: "Over the last two weeks, how often have you been bothered by…",
    source: "GAD-7",
    choices: FREQUENCY,
    items: [
      "Feeling nervous, anxious or on edge",
      "Not being able to stop or control worrying",
      "Worrying too much about different things",
      "Trouble relaxing",
      "Being so restless that it is hard to sit still",
      "Becoming easily annoyed or irritable",
      "Feeling afraid, as if something awful might happen",
    ],
    bands: [
      { from: 0, label: "Minimal", note: "Worry is not currently doing much damage." },
      { from: 5, label: "Mild", note: "Present, and worth having a plan for." },
      { from: 10, label: "Moderate", note: "This is the level at which therapy usually helps most." },
      { from: 15, label: "Severe", note: "Enough that a clinical assessment is worth booking." },
    ],
  },
  {
    id: "mood",
    title: "Mood",
    stem: "Over the last two weeks, how often have you been bothered by…",
    source: "PHQ-8",
    choices: FREQUENCY,
    items: [
      "Little interest or pleasure in doing things",
      "Feeling down, depressed or hopeless",
      "Trouble falling asleep, staying asleep, or sleeping too much",
      "Feeling tired or having little energy",
      "Poor appetite or overeating",
      "Feeling bad about yourself, or that you have let yourself or your family down",
      "Trouble concentrating on things, such as reading or watching something",
      "Moving or speaking so slowly that others noticed — or the opposite, being restless",
    ],
    bands: [
      { from: 0, label: "Minimal", note: "Mood is holding up." },
      { from: 5, label: "Mild", note: "A dip that is worth talking about before it settles in." },
      { from: 10, label: "Moderate", note: "Persistent enough that support usually shortens it." },
      { from: 15, label: "Moderately severe", note: "Worth a clinical assessment, not only therapy." },
      { from: 20, label: "Severe", note: "Please treat this as a reason to speak to someone soon." },
    ],
  },
  {
    id: "stress",
    title: "Load",
    stem: "In the last month, how often have you felt…",
    source: "PSS-4",
    choices: HOW_OFTEN,
    items: [
      "That you were unable to control the important things in your life",
      "Confident about your ability to handle your personal problems",
      "That things were going your way",
      "That difficulties were piling up so high you could not overcome them",
    ],
    // items 2 and 3 are asked positively, so their scoring runs the other way
    reversed: [1, 2],
    bands: [
      { from: 0, label: "Low", note: "The load is within what you can carry right now." },
      { from: 6, label: "Moderate", note: "Manageable, but it is costing you something." },
      { from: 11, label: "High", note: "More than is sustainable without help." },
    ],
  },
];

export function maxScore(scale: Scale): number {
  const top = Math.max(...scale.choices.map((c) => c.value));
  return scale.items.length * top;
}

export type ScaleResult = {
  scale: Scale;
  score: number;
  max: number;
  /** 0–100, rounded — the number shown on the result. */
  percent: number;
  band: { from: number; label: string; note: string };
};

export function scoreScale(scale: Scale, answers: (number | null)[]): ScaleResult {
  const top = Math.max(...scale.choices.map((c) => c.value));
  const score = scale.items.reduce((sum, _item, i) => {
    const raw = answers[i] ?? 0;
    return sum + (scale.reversed?.includes(i) ? top - raw : raw);
  }, 0);
  const max = maxScore(scale);
  const band = [...scale.bands].reverse().find((b) => score >= b.from) ?? scale.bands[0];
  return { scale, score, max, percent: Math.round((score / max) * 100), band };
}

/* ── the question sequence ─────────────────────────────────────────────── */

/**
 * All nineteen items flattened into one ordered run, so the dialog can ask them
 * one at a time. Each carries the scale it belongs to and its index within that
 * scale, which is all the scorer needs to put the answer back where it came
 * from.
 */
export type Question = {
  scale: Scale;
  /** Index of this item inside its own scale. */
  index: number;
  /** 1-based position in the whole run, for "6 of 19". */
  n: number;
  text: string;
};

export const QUESTIONS: Question[] = SCALES.flatMap((scale) =>
  scale.items.map((text, index) => ({ scale, index, text, n: 0 }))
).map((q, i) => ({ ...q, n: i + 1 }));

/* ── what is going on, in their words ──────────────────────────────────── */

/**
 * The one question the screeners cannot answer: what is this actually about?
 * Scores say how heavy it is; this says which of the ten services fits.
 */
export type Context = {
  id: string;
  label: string;
  /** The same thing in the second person, for the sentence explaining the
   *  recommendation. Slicing the label produced "mostly about my family". */
  phrase: string;
  /** Which service this points at when it is the strongest signal. */
  service: string;
  /** Concern id in lib/matching, for ranking therapists. */
  concern: Concern["id"];
};

export const CONTEXTS: Context[] = [
  { id: "everyday", label: "Everyday load — work, money, the general pace of it", phrase: "the everyday load — work, money, the general pace of it", service: "daily-life-stress", concern: "stress" },
  { id: "study", label: "Studies, exams or placements", phrase: "studies, exams or placements", service: "student-support", concern: "career" },
  { id: "work", label: "My job, or what to do next in my career", phrase: "your job, and what comes next in it", service: "career-counselling", concern: "career" },
  { id: "love", label: "A relationship I am working through on my own", phrase: "a relationship you are working through on your own", service: "love-life-counselling", concern: "relationships" },
  { id: "partner", label: "My partner and I, together", phrase: "you and your partner, together", service: "couples-counseling", concern: "relationships" },
  { id: "family", label: "My family — parents, siblings, in-laws", phrase: "your family", service: "family-therapy", concern: "relationships" },
  { id: "identity", label: "My gender or sexuality, and who knows about it", phrase: "your gender or sexuality, and who knows about it", service: "lgbtqia-affirmative", concern: "anxiety" },
  { id: "self", label: "Myself — how I have been feeling, more than any one thing", phrase: "how you have been feeling, more than any one thing", service: "individual-therapy", concern: "depression" },
];

/* ── the recommendation ────────────────────────────────────────────────── */

export type Recommendation = {
  results: ScaleResult[];
  /** The single service we suggest starting with. */
  service: Service;
  /** Why, in one sentence, in plain language. */
  because: string;
  /** A second option, usually a cheaper or lighter way in. */
  alternative: Service | null;
  /** True when a score is high enough that we say so plainly. */
  clinical: boolean;
  experts: Expert[];
};

const svc = (slug: string): Service =>
  services.find((s) => s.slug === slug) ?? services[0];

export function recommend(
  answers: Record<ScaleId, (number | null)[]>,
  contextId: string | null,
  /** The catalogue, so a suggestion can only name therapists who are listed. */
  catalogue: Expert[]
): Recommendation {
  const results = SCALES.map((s) => scoreScale(s, answers[s.id] ?? []));
  const by = (id: ScaleId) => results.find((r) => r.scale.id === id)!;

  const anxiety = by("anxiety");
  const mood = by("mood");
  const stress = by("stress");
  const context = CONTEXTS.find((c) => c.id === contextId) ?? null;

  // The one threshold that overrides what someone came in for. GAD-7 ≥ 15 and
  // PHQ-8 ≥ 15 are the published cut-offs at which a clinical assessment is
  // indicated, so at that point we say so rather than routing on preference.
  const clinical = anxiety.score >= 15 || mood.score >= 15;

  let service: Service;
  let because: string;
  let alternative: Service | null;

  if (clinical) {
    service = svc("psychiatry-medication");
    because =
      "Your answers sit in the range where a clinician would want to assess properly — not because something is wrong with you, but because at this level medication is worth ruling in or out rather than guessing about.";
    alternative = svc(context?.service ?? "individual-therapy");
  } else if (context) {
    service = svc(context.service);
    because = `You said the weight is mostly about ${context.phrase}, and your scores are in a range therapy handles well.`;
    // when everything is mild, offer the cheaper way in as well
    const mild = anxiety.score < 10 && mood.score < 10 && stress.score < 11;
    alternative = mild && service.slug !== "group-sessions" ? svc("group-sessions") : svc("individual-therapy");
  } else {
    service = svc("individual-therapy");
    because =
      "Nothing points to one specific area, which is usually a sign that open-ended one-to-one work is the right place to start.";
    alternative = svc("daily-life-stress");
  }

  if (alternative && alternative.slug === service.slug) alternative = null;

  // Rank therapists on the concern that is actually loudest.
  const loudest: ScaleId =
    anxiety.percent >= mood.percent && anxiety.percent >= stress.percent
      ? "anxiety"
      : mood.percent >= stress.percent
        ? "mood"
        : "stress";
  const concernId = context?.concern ?? (loudest === "mood" ? "depression" : loudest === "stress" ? "stress" : "anxiety");
  const keys = concernMap.find((c) => c.id === concernId)?.keys ?? ["anxiety"];
  const experts = rank(catalogue, keys, "Any language", () => true).slice(0, 2);

  return { results, service, because, alternative, clinical, experts };
}

/** Total number of scored questions, for the progress line. */
export const TOTAL_ITEMS = SCALES.reduce((n, s) => n + s.items.length, 0);
