export type Service = {
  slug: string;
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
    slug: "individual-therapy",
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
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "A counsellor listening attentively during a one-on-one conversation",
  },
  {
    slug: "couples-counseling",
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
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "A couple sitting together, holding hands during a conversation",
  },
  {
    slug: "student-support",
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
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "A student studying with books and notes spread on a desk",
  },
  {
    slug: "corporate-wellness",
    title: "Corporate & Workplace Wellness",
    shortTitle: "Workplace",
    tag: "for teams",
    description:
      "Burnout doesn't show up in dashboards until it's expensive. We partner with companies to give teams real psychological support — confidential 1-on-1 sessions, group workshops, and manager training — not a wellness poster in the pantry.",
    expect: [
      "Confidential employee sessions, never reported to HR by name",
      "Workshops on burnout, boundaries, and difficult conversations",
      "Quarterly anonymised wellbeing insights for leadership",
      "Onboarding in under two weeks",
    ],
    duration: "Custom programs",
    price: null,
    priceNote: "custom pricing for teams",
    image:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Colleagues collaborating around a table in a bright office",
  },
  {
    slug: "group-sessions",
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
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "A small group of young people sitting together outdoors, talking",
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
