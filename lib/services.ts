export type Service = {
  slug: string;
  /** The Devanagari mark this format carries, as `Segment` has on the
   *  institutions page — one word, in the language most of our clients think in. */
  deva: string;
  title: string;
  shortTitle: string;
  tag: string;
  description: string;
  expect: string[];
  duration: string;
  price: number | null;
  priceNote: string;
  image: string;
  imageAlt: string;
};

export const services: Service[] = [
  {
    slug: "psychiatry-medication",
    deva: "चिकित्सा",
    title: "Psychiatry & Medication",
    shortTitle: "Psychiatry",
    tag: "with a doctor",
    description:
      "Some things therapy alone cannot reach. A psychiatrist can assess whether medication would help, prescribe it, and review how it is working — without treating you as a diagnosis. Many people do both: medication to make the days workable, therapy to do the actual work.",
    expect: [
      "A registered psychiatrist, not a general physician",
      "An honest read on whether medication is needed at all",
      "Prescriptions, dose reviews, and help coming off when it is time",
      "Coordinated with your therapist, if you have one with us",
    ],
    duration: "30 minutes",
    price: 1499,
    priceNote: "per consultation",
    image:
      "https://images.unsplash.com/photo-1758691461990-03b49d969495?auto=format&fit=crop&w=1200&q=80",
    imageAlt:
      "A clinician writing notes on a clipboard across a consultation desk",
  },
  {
    slug: "individual-therapy",
    deva: "व्यक्ति",
    title: "Individual Therapy",
    shortTitle: "Individual",
    tag: "one-on-one",
    description:
      "Fifty minutes that belong entirely to you. Whether it's anxiety that hums in the background all day, a low mood you can't name, or just the feeling that you're carrying too much — your therapist meets you where you are, without judgement and without rush.",
    expect: [
      "A matched therapist based on your concern, language, and budget",
      "Evidence-based approaches — CBT, ACT, mindfulness-based therapy",
      "A private video room; no app download needed",
      "Session notes and small practices to carry between sessions",
    ],
    duration: "50 minutes",
    price: 999,
    priceNote: "per session",
    image:
      "https://images.unsplash.com/photo-1507537362848-9c7e70b7b5c1?auto=format&fit=crop&w=1200&q=80",
    imageAlt:
      "Two people talking across a table beside a window, one of them seen from behind",
  },
  {
    slug: "daily-life-stress",
    deva: "रोज़",
    title: "Daily Life Stress",
    shortTitle: "Daily stress",
    tag: "the everyday weight",
    description:
      "Nothing is wrong, exactly. The commute, the group chats, the money, the family calls, the sense of being permanently behind — none of it is a crisis, and all of it adds up. You do not need a diagnosis to deserve an hour that is about you.",
    expect: [
      "For the pressure that never quite becomes an emergency",
      "Practical tools for sleep, overthinking, and the Sunday dread",
      "Short-term work — many people need four to six sessions, not four years",
      "Evening and weekend slots, because that is when it lands",
    ],
    duration: "45 minutes",
    price: 799,
    priceNote: "per session",
    image:
      "https://images.unsplash.com/photo-1603214982731-6d7fa94d6742?auto=format&fit=crop&w=1200&q=80",
    imageAlt:
      "A woman sitting by a window in a plant-filled room, looking out",
  },
  {
    slug: "student-support",
    deva: "विद्यार्थी",
    title: "Student & Exam Stress Support",
    shortTitle: "Students",
    tag: "for students",
    description:
      "Boards, JEE, NEET, CAT, placements, 'what next?' — Indian student life carries a weight most adults have forgotten. Talk to someone who understands exam pressure, family expectations, and the fear of falling behind, at a price built for a student budget.",
    expect: [
      "Counsellors who specialise in adolescent and young-adult concerns",
      "Help with exam anxiety, focus, sleep, and burnout",
      "Completely confidential — parents are involved only if you choose",
      "Flexible evening and weekend slots around classes",
    ],
    duration: "45 minutes",
    price: 599,
    priceNote: "per session, student pricing",
    image:
      "https://images.unsplash.com/photo-1544456203-0af5a69f5789?auto=format&fit=crop&w=1200&q=80",
    imageAlt:
      "A student reading alone at a long library desk under warm lamps",
  },
  {
    slug: "career-counselling",
    deva: "आजीविका",
    title: "Career Counselling",
    shortTitle: "Career",
    tag: "work & direction",
    description:
      "The job you took because it was sensible. The degree chosen by consensus. The offer you are afraid to refuse. Career counselling here is not aptitude tests and a printout — it is working out what you actually want, and what is stopping you saying it out loud.",
    expect: [
      "For students choosing, and for professionals reconsidering",
      "Burnout, imposter feelings, and deciding whether to leave",
      "Family expectations treated as part of the problem, not ignored",
      "A counsellor who will not simply tell you to follow your passion",
    ],
    duration: "50 minutes",
    price: 899,
    priceNote: "per session",
    image:
      "https://images.unsplash.com/photo-1591382696448-3809bb398c0e?auto=format&fit=crop&w=1200&q=80",
    imageAlt:
      "A desk with a laptop and a plant at a window looking onto rooftops",
  },
  {
    slug: "love-life-counselling",
    deva: "प्रेम",
    title: "Love Life Counselling",
    shortTitle: "Love life",
    tag: "on your own",
    description:
      "For the part of your love life you are working through by yourself. A situationship going nowhere, a breakup nobody else is taking seriously, dating fatigue, a marriage being arranged around you, or wanting someone your family has not agreed to. You can come without your partner. Most people do.",
    expect: [
      "One-on-one — your partner does not need to know or attend",
      "Breakups, situationships, dating burnout, and infidelity",
      "Arranged-marriage pressure and choosing across family lines",
      "No judgement about what you want or who you want it with",
    ],
    duration: "50 minutes",
    price: 999,
    priceNote: "per session",
    image:
      "https://images.unsplash.com/photo-1604881989793-466aca8dd319?auto=format&fit=crop&w=1200&q=80",
    imageAlt:
      "Two people talking across a table with cups of coffee, hands resting between them",
  },
  {
    slug: "couples-counseling",
    deva: "साथ",
    title: "Couples & Relationship Counseling",
    shortTitle: "Couples",
    tag: "together",
    description:
      "Every relationship hits stretches where talking turns into talking past each other. A trained couples counsellor holds space for both of you — partners, engaged, married, long-distance — so the conversation can finally go somewhere new.",
    expect: [
      "A counsellor trained specifically in relationship work",
      "Joint sessions, with individual check-ins when useful",
      "Practical communication tools, not blame-finding",
      "A pace both partners agree on",
    ],
    duration: "60 minutes",
    price: 1499,
    priceNote: "per session, for both of you",
    image:
      "https://images.unsplash.com/photo-1571771894806-9668f47e6666?auto=format&fit=crop&w=1200&q=80",
    imageAlt:
      "Two people sitting close together in conversation, seen from behind",
  },
  {
    slug: "family-therapy",
    deva: "परिवार",
    title: "Family Therapy",
    shortTitle: "Family",
    tag: "the whole room",
    description:
      "The Indian family is close, and closeness is not the same as ease. Sessions with parents, adult children, siblings or in-laws — held by someone whose job is the relationship rather than any one person's side. Nobody is put on trial, and nobody has to win.",
    expect: [
      "Two to five family members, in one room or on one call",
      "Adult children and parents, siblings, and in-law conflict",
      "A therapist who holds every side without taking one",
      "Individual check-ins alongside, when they help",
    ],
    duration: "75 minutes",
    price: 1799,
    priceNote: "per session, for the family",
    image:
      "https://images.unsplash.com/photo-1654613698246-b6d44aef0fd5?auto=format&fit=crop&w=1200&q=80",
    imageAlt:
      "A family sitting together on sofas in a bright room, mid-conversation",
  },
  {
    slug: "lgbtqia-affirmative",
    deva: "अपनापन",
    title: "LGBTQIA+ Affirmative Therapy",
    shortTitle: "LGBTQIA+",
    tag: "affirmative care",
    description:
      "Therapy where your identity is the starting point, not the thing being examined. With counsellors trained in affirmative practice — who will never treat being queer or trans as the problem to be solved, and who know what coming out costs in an Indian family.",
    expect: [
      "Counsellors trained in affirmative practice, several from the community",
      "Coming out, family reaction, and deciding not to come out yet",
      "Gender identity, transition, and the paperwork around it",
      "Never conversion practice — it is unethical, and illegal here",
    ],
    duration: "50 minutes",
    price: 999,
    priceNote: "per session",
    image:
      "https://images.unsplash.com/photo-1543097504-4604769313d0?auto=format&fit=crop&w=1200&q=80",
    imageAlt:
      "Light through a prism falling in bands of colour across an open hand",
  },
  {
    slug: "group-sessions",
    deva: "समूह",
    title: "Group Sessions",
    shortTitle: "Groups",
    tag: "in good company",
    description:
      "Some things are easier to say among people who get it. Small, therapist-led circles — six to eight people, one shared theme — on grief, anxiety, new parenthood, or starting over. You can just listen for the first few sessions. Many do.",
    expect: [
      "Small groups of 6–8, matched by theme and life stage",
      "Led by a therapist trained in group facilitation",
      "Clear group agreements — confidentiality is mutual",
      "The most affordable way to begin therapy",
    ],
    duration: "90 minutes",
    price: 399,
    priceNote: "per session",
    image:
      "https://images.unsplash.com/photo-1655337690436-98778f38d613?auto=format&fit=crop&w=1200&q=80",
    imageAlt:
      "A small group sitting together in a bright room, mid-conversation",
  },
];

export const comparison = {
  columns: ["Individual", "Couples", "Students", "Groups"],
  rows: [
    { label: "Session length", values: ["50 min", "60 min", "45 min", "90 min"] },
    { label: "Starting price", values: ["₹999", "₹1,499", "₹599", "₹399"] },
    { label: "Licensed psychologist", values: [true, true, true, true] },
    { label: "Same therapist every time", values: [true, true, true, true] },
    { label: "Evening & weekend slots", values: [true, true, true, false] },
    { label: "Sessions in 2+ languages", values: [true, true, true, false] },
    { label: "Between-session practices", values: [true, true, true, false] },
    { label: "Free reschedule (24h notice)", values: [true, true, true, true] },
  ],
};

/**
 * How a first session actually happens, start to finish. Same shape as
 * `steps` in lib/organisations.ts, because the two pages tell the same kind of
 * story and should look like they were made by the same people.
 */
export const sessionSteps = [
  {
    n: "01",
    title: "Tell us what's going on",
    body: "A few questions about what you're carrying, the language you're most yourself in, and what you can sustain. Five minutes, and no account needed to look.",
  },
  {
    n: "02",
    title: "We match you",
    body: "A licensed psychologist chosen for your concern and your language — not whoever has the next free slot. If the fit is wrong, say so and we move you, no explanation owed.",
  },
  {
    n: "03",
    title: "The first session",
    body: "Fifty minutes that are entirely yours. No diagnosis on day one. Most people spend the first ten deciding whether to say the real thing, and that is fine.",
  },
  {
    n: "04",
    title: "What follows",
    body: "The same therapist each time, small practices to carry between sessions, and a free reschedule up to 24 hours before. You stop whenever you want to.",
  },
];
