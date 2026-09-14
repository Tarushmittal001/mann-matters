/**
 * The brain palette — the site's one source of colour beyond forest and gold.
 *
 * These eight are the regions of the neural brain on the home page, each with
 * the feeling it was given there. They were already being re-typed by hand in
 * `TheRoom`, and were about to be re-typed a third time for the service cards,
 * so they live here now and everything reads them from one place.
 *
 * Using them across the site is not decoration for its own sake: the home page
 * teaches that a mind is many regions with different feelings, all wired
 * together. Carrying those same eight colours onto the things we offer says the
 * services are parts of one mind rather than a product list.
 */

export type RGB = readonly [number, number, number];

export type Region = {
  id: string;
  /** The part of the brain this colour belongs to on the home page. */
  name: string;
  /** What that region feels, in the words the home page uses. */
  emotion: string;
  hex: string;
  rgb: RGB;
};

export const REGIONS: Record<string, Region> = {
  indigo: { id: "indigo", name: "Frontal lobe", emotion: "Focus, planning & self-control", hex: "#4C6FA5", rgb: [76, 111, 165] },
  violet: { id: "violet", name: "Prefrontal cortex", emotion: "Pausing, reflecting & emotional balance", hex: "#7A6BA8", rgb: [122, 107, 168] },
  teal: { id: "teal", name: "Parietal lobe", emotion: "Awareness & staying present", hex: "#2E8C8C", rgb: [46, 140, 140] },
  rose: { id: "rose", name: "Limbic system", emotion: "The core of joy, fear & love", hex: "#C56A72", rgb: [197, 106, 114] },
  amber: { id: "amber", name: "Temporal lobe", emotion: "Memory, meaning & mood", hex: "#C8A45D", rgb: [200, 164, 93] },
  plum: { id: "plum", name: "Occipital lobe", emotion: "Seeing & making sense of things", hex: "#9B5F8A", rgb: [155, 95, 138] },
  moss: { id: "moss", name: "Cerebellum", emotion: "Balance & steadiness", hex: "#7D9150", rgb: [125, 145, 80] },
  mint: { id: "mint", name: "Brain stem", emotion: "Breath, calm & feeling safe", hex: "#5FA98A", rgb: [95, 169, 138] },
};

/**
 * A region per service, chosen for what the region *feels* rather than for
 * variety — psychiatry gets the brain stem because that is where breath and
 * safety live; student support gets the frontal lobe, which is focus and
 * planning; love gets the limbic system.
 *
 * Ten services and eight regions, so two colours appear twice. The repeats are
 * deliberately placed far apart in the grid, and they are the two pairs where
 * sharing a colour is honest: presence (individual, affirmative care) and calm
 * (psychiatry, groups).
 */
export const SERVICE_REGION: Record<string, string> = {
  "psychiatry-medication": "mint", // breath, calm & feeling safe
  "individual-therapy": "teal", // awareness & staying present
  "daily-life-stress": "moss", // balance & steadiness
  "student-support": "indigo", // focus, planning & self-control
  "career-counselling": "violet", // pausing, reflecting & emotional balance
  "love-life-counselling": "rose", // the core of joy, fear & love
  "couples-counseling": "amber", // memory, meaning & mood
  "family-therapy": "plum", // seeing & making sense of things
  "lgbtqia-affirmative": "teal", // awareness & staying present
  "group-sessions": "mint", // breath, calm & feeling safe
};

/** The region a service wears. Falls back to teal for anything unmapped. */
export function regionFor(slug: string): Region {
  return REGIONS[SERVICE_REGION[slug] ?? "teal"] ?? REGIONS.teal;
}

/**
 * A region per institution type on /for-organisations, chosen the same way —
 * by what the region feels, not for spread. Six types, six different regions,
 * so no two cards on that page share a colour.
 */
export const SEGMENT_REGION: Record<string, string> = {
  "play-schools": "mint", // breath, calm & feeling safe — what early years is for
  schools: "indigo", // focus, planning & self-control
  colleges: "violet", // pausing, reflecting — the first term away
  institutes: "rose", // the core of fear — coaching runs on it
  companies: "moss", // balance & steadiness, or the lack of it
  organisations: "plum", // seeing & making sense of things
};

export function regionForSegment(id: string): Region {
  return REGIONS[SEGMENT_REGION[id] ?? "teal"] ?? REGIONS.teal;
}

/** A region per program pillar — the six parts a program is assembled from. */
export const PILLAR_REGION: Record<string, string> = {
  counselling: "teal", // awareness & staying present
  manu: "mint", // breath, calm — the thing that answers at 4 a.m.
  workshops: "amber", // memory & meaning
  training: "indigo", // focus & planning
  screening: "violet", // pausing & reflecting
  protocol: "rose", // fear — the day you hoped would not come
};

export function regionForPillar(id: string): Region {
  return REGIONS[PILLAR_REGION[id] ?? "teal"] ?? REGIONS.teal;
}

/** One region per self-check scale, so the result bars are not three golds. */
export const SCALE_REGION: Record<string, string> = {
  anxiety: "rose", // the limbic system is where fear actually lives
  mood: "violet", // reflection and emotional balance
  stress: "moss", // balance & steadiness, or the lack of it
};

export function regionForScale(id: string): Region {
  return REGIONS[SCALE_REGION[id] ?? "teal"] ?? REGIONS.teal;
}

export function rgba(rgb: RGB, a: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
}
