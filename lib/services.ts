export type Service = {
  slug: string;
  /** The Devanagari mark this format carries, as `Segment` has on the
   *  institutions page — one word, in the language most of our clients think in. */
  deva: string;
  title: string;
  shortTitle: string;
  tag: string;
  /** One line for the card. The full description lives on the detail page. */
  summary: string;
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
    summary: "A psychiatrist to assess, prescribe and review medication, alongside therapy rather than instead of it.",
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
    summary: "Fifty minutes with one psychologist, entirely about you.",
    description:
      "Fifty minutes that are yours alone. You may feel anxious all day. You may feel low and not know why. You may just feel like you are carrying too much. Your therapist starts where you are, with no judgement and no rush.",
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
    summary: "For the pressure that never quite becomes a crisis. Short and practical.",
    description:
      "Nothing is really wrong. But the commute, the money, the family calls and the feeling of always being behind do add up. None of it is a crisis. You still do not need a diagnosis to deserve an hour that is about you.",
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
    summary: "Exams, placements and the what-next question, at a student price.",
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
    summary: "Work out what you actually want from work, and what is stopping you.",
    description:
      "The job you took because it was the safe choice. The degree everyone agreed on. The offer you are afraid to turn down. This is not an aptitude test with a printout. It is time to work out what you want, and what stops you from saying it out loud.",
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
    summary: "Breakups, situationships and marriage pressure. One-on-one, no partner needed.",
    description:
      "For the part of your love life you are working through alone. A relationship going nowhere. A breakup nobody else takes seriously. Being tired of dating. A marriage being arranged for you. Or loving someone your family has not accepted. You can come without your partner. Most people do.",
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
    summary: "For when talking has turned into talking past each other.",
    description:
      "Every relationship goes through phases where you talk but stop hearing each other. A trained couples counsellor gives you both room to speak, so the conversation can move again. For partners, engaged couples, married couples, and people living apart.",
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
    summary: "Parents, siblings, in-laws. One room, and nobody on trial.",
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
    summary: "Affirmative care where your identity is the starting point, never the problem.",
    description:
      "Therapy that starts with who you are, instead of questioning it. Our counsellors are trained in affirmative practice. They will never treat being queer or trans as a problem to fix. And they understand what coming out can cost in an Indian family.",
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
    slug: "teen-therapy",
    deva: "किशोर",
    title: "Teen Therapy (13–17)",
    shortTitle: "Teen therapy",
    tag: "for 13–17",
    summary: "A private hour for a teenager, with a parent kept in the loop on what matters and out of what doesn't.",
    description:
      "Board exams, friendships, phones, bodies, and parents whose worry lands as pressure. Teenagers rarely need fixing. They need a space of their own where the adult listens first. Sessions are private. There is one exception, and we explain it to everyone at the start: if your child is at risk of harm, we tell a parent.",
    expect: [
      "A psychologist who has worked with this age group, not an adult therapist improvising",
      "A guardian's consent taken before the first session, as the law requires",
      "Confidentiality explained to the teen and the parent in the same breath",
      "Parents updated on direction and progress, never on the contents of the hour",
    ],
    duration: "45 minutes",
    price: 799,
    priceNote: "per session, guardian consent needed",
    image:
      "https://images.unsplash.com/photo-1709290749293-c6152a187b14?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Teenagers in school uniform at their desks in a secondary-school classroom",
  },
  {
    slug: "parent-coaching",
    deva: "माता-पिता",
    title: "Parent Coaching",
    shortTitle: "Parent coaching",
    tag: "for parents",
    summary: "Help for the parent, not the child: what to say, what to stop saying, and how to stay close while they pull away.",
    description:
      "Most parents come to us having already tried everything they know. This is practical coaching for you, not for your child. How to start a conversation that does not end in a slammed door. How to hold a limit without a fight. How to tell normal teenage behaviour from something that needs help. Your child does not have to attend, or even know.",
    expect: [
      "Specific words for the conversation you keep getting wrong",
      "A read on what is developmentally normal and what is worth worrying about",
      "Ways to stay connected through exam years, phones and silence",
      "A clear recommendation if your child would benefit from their own therapist",
    ],
    duration: "50 minutes",
    price: 999,
    priceNote: "per session",
    image:
      "https://images.unsplash.com/photo-1758525863085-465f6953ed5c?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "A parent braiding a teenage daughter's hair on the stairs at home",
  },
  {
    slug: "sleep-programme",
    deva: "निद्रा",
    title: "Sleep Programme (CBT-I)",
    shortTitle: "Sleep programme",
    tag: "six sessions",
    summary: "The structured, evidence-based treatment for insomnia — six sessions, not a sleeping pill.",
    description:
      "Cognitive behavioural therapy for insomnia, or CBT-I, is what sleep specialists suggest before medication. It is a fixed course, not open-ended therapy. You track your sleep. You reset the hours you spend in bed. And you work through the 3 a.m. thoughts that keep you awake. Most people notice a change within three or four weeks.",
    expect: [
      "A sleep diary that shows what is actually happening, not what it feels like",
      "A schedule rebuilt around when you genuinely sleep",
      "Work on the anxiety about sleeping that outlives the original cause",
      "A plan for keeping the gains after the six sessions end",
    ],
    duration: "50 minutes",
    price: 999,
    priceNote: "per session, six-session programme",
    image:
      "https://images.unsplash.com/photo-1520206183501-b80df61043c2?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "A person asleep, their face resting on a pillow",
  },
  {
    slug: "grief-loss",
    deva: "शोक",
    title: "Grief & Loss",
    shortTitle: "Grief & loss",
    tag: "after a loss",
    summary: "For a death, a diagnosis, a marriage ending — somewhere to put grief that the world expects you to have finished with.",
    description:
      "Grief in India comes with a full house, rituals to perform, and a silent deadline for being fine again. Therapy is not a way to get over someone. It is time set aside for the loss itself. You can say what you cannot say at home. You can feel guilt, or relief, without being judged. And you can work out how to carry on with that person still part of you.",
    expect: [
      "No timeline, and no pressure to be further along than you are",
      "Room for the complicated feelings — relief, anger, guilt — that grief is not supposed to include",
      "Support through firsts: the first birthday, the first festival, the anniversary",
      "Help telling ordinary grief apart from depression that needs its own treatment",
    ],
    duration: "50 minutes",
    price: 999,
    priceNote: "per session",
    image:
      "https://images.unsplash.com/photo-1604881991720-f91add269bed?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Two people's hands held together on a table",
  },
  {
    slug: "group-sessions",
    deva: "समूह",
    title: "Group Sessions",
    shortTitle: "Groups",
    tag: "in good company",
    summary: "Small therapist-led circles of six to eight. The most affordable way in.",
    description:
      "Some things are easier to say among people who get it. Small, therapist-led circles — six to eight people, one shared theme — on grief, anxiety, new parenthood, or starting over. You can just listen for the first few sessions. Many do.",
    expect: [
      "Small groups of 6–8, matched by theme and life stage",
      "Led by a therapist trained to run groups",
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

/**
 * How a first session actually happens, start to finish. Same shape as
 * `steps` in lib/organisations.ts, because the two pages tell the same kind of
 * story and should look like they were made by the same people.
 */
export const sessionSteps = [
  {
    n: "01",
    title: "Tell us what's going on",
    body: "A few questions about what you're carrying, the language you're most yourself in, and what you can sustain. Five minutes, with a free account.",
  },
  {
    n: "02",
    title: "We match you",
    body: "A certified psychologist chosen for your concern and your language — not whoever has the next free slot. If the fit is wrong, say so and we move you, no explanation owed.",
  },
  {
    n: "03",
    title: "The first session",
    body: "Time that is entirely yours — how long depends on the service you booked. No diagnosis on day one. Most people spend the first ten minutes deciding whether to say the real thing, and that is fine.",
  },
  {
    n: "04",
    title: "What follows",
    body: "The same therapist each time, small practices to carry between sessions, and a free reschedule up to 24 hours before. You stop whenever you want to.",
  },
];

/**
 * Which concern each service reports as.
 *
 * The concern is no longer asked for — it is derived from the service. It
 * still does two jobs: it ranks practitioners, and it tells the practitioner
 * what the session is about. It lives here rather than in
 * `lib/service-catalogue.ts` because the booking flow is a client component
 * and that module reaches the database.
 */
export const SERVICE_CONCERN: Record<string, string> = {
  "psychiatry-medication": "depression",
  "individual-therapy": "anxiety",
  "daily-life-stress": "stress",
  "student-support": "career",
  "career-counselling": "career",
  "love-life-counselling": "relationships",
  "couples-counseling": "relationships",
  "family-therapy": "relationships",
  "lgbtqia-affirmative": "anxiety",
  "teen-therapy": "anxiety",
  "parent-coaching": "relationships",
  "sleep-programme": "sleep",
  "grief-loss": "relationships",
  "group-sessions": "stress",
};

export function concernForService(slug: string): string {
  return SERVICE_CONCERN[slug] ?? "anxiety";
}

/* ── who offers what, without touching the database ──────────────────────
   These take an expert that has already been loaded, so they are safe in
   browser code. lib/service-catalogue.ts re-exports them for the server. */

type Offers = { services: string[]; servicePrices?: Record<string, number> };

/**
 * How long a service runs, in minutes.
 *
 * `duration` is prose ("50 minutes", "1 hour 15 minutes") because that is what
 * a card has to read, so the number is parsed back out of it here rather than
 * duplicated as a second field that could disagree with the words beside it.
 *
 * This is not cosmetic. The expert portal decides when a session is over and
 * when the meeting room shuts from this number; getting it from a flat
 * per-therapist default closed a 90-minute group ten minutes before it ended.
 */
export function durationMinutesFor(slug: string): number | null {
  const text = services.find((s) => s.slug === slug)?.duration;
  if (!text) return null;
  const hours = /(\d+)\s*(?:hour|hr)/i.exec(text);
  const mins = /(\d+)\s*(?:minute|min)/i.exec(text);
  const total = (hours ? Number(hours[1]) * 60 : 0) + (mins ? Number(mins[1]) : 0);
  return total > 0 ? total : null;
}

/** The services one practitioner is cleared for, in catalogue order. */
export function servicesForExpert(expert: Offers): Service[] {
  return services.filter((s) => expert.services.includes(s.slug));
}

/**
 * What this practitioner charges for this service.
 *
 * The one function that answers the price question, so the booking route, the
 * therapist card and the admin screen can never disagree about it. Order is:
 * their own rate if they set one, otherwise the service's standard price,
 * otherwise null — which means "priced on request" and is never guessed at.
 *
 * Note that an override of 0 is honoured. A practitioner may genuinely offer a
 * free first consultation, and `?? ` would swallow that into the standard
 * price; the explicit check is the difference between free and full rate.
 */
export function priceForExpertService(expert: Offers, slug: string): number | null {
  const own = expert.servicePrices?.[slug];
  if (typeof own === "number") return own;
  return services.find((s) => s.slug === slug)?.price ?? null;
}

/** The lowest price a practitioner can be booked at, for a "from ₹X" line. */
export function fromPriceForExpert(expert: Offers): number | null {
  const prices = servicesForExpert(expert)
    .map((s) => priceForExpertService(expert, s.slug))
    .filter((p): p is number => typeof p === "number");
  return prices.length ? Math.min(...prices) : null;
}

/**
 * What a service costs across everyone who can deliver it.
 *
 * `null` when nobody qualified has a price — the service is real but not
 * sellable, and the card says so instead of inventing a number. When min and
 * max match, callers render one price rather than a range of one.
 *
 * The experts handed in must already be the bookable ones. A range whose floor
 * comes from a hidden listing advertises an entry price nobody can reach, and
 * that is the whole objection to "from ₹X" pricing.
 */
export function priceRangeForService(slug: string, offeredBy: Offers[]): { min: number; max: number } | null {
  const prices = offeredBy
    .filter((e) => e.services.includes(slug))
    .map((e) => priceForExpertService(e, slug))
    .filter((p): p is number => typeof p === "number");
  if (!prices.length) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/**
 * Which service fits each concern, best first.
 *
 * An explicit order rather than "the cheapest match": several services report
 * as "relationships", and somebody asking about relationships means love life
 * or one-to-one work before they mean parent coaching.
 */
const CONCERN_PREFERENCE: Record<string, string[]> = {
  anxiety: ["individual-therapy", "daily-life-stress"],
  stress: ["daily-life-stress", "individual-therapy"],
  relationships: ["love-life-counselling", "individual-therapy", "couples-counseling", "family-therapy"],
  career: ["career-counselling", "student-support", "individual-therapy"],
  sleep: ["sleep-programme", "individual-therapy"],
  depression: ["individual-therapy", "psychiatry-medication"],
};

/**
 * The service to book with this practitioner for this concern.
 *
 * The first in the concern's preference order that they are cleared for;
 * failing that, individual therapy if they offer it; failing that, whatever
 * they do offer. Null if they offer nothing.
 */
export function serviceForConcern(expert: Offers, concernId: string | null | undefined): Service | null {
  const offered = servicesForExpert(expert);
  if (!offered.length) return null;
  const order = (concernId && CONCERN_PREFERENCE[concernId]) || [];
  const preferred = order.map((slug) => offered.find((s) => s.slug === slug)).find(Boolean);
  return preferred ?? offered.find((s) => s.slug === "individual-therapy") ?? offered[0];
}
