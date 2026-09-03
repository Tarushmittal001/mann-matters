import type { Faq } from "@/lib/faqs";

/** The institutions we build programs for, and what each one is actually up against. */
export type Segment = {
  id: string;
  deva: string;
  name: string;
  who: string;
  pressure: string;
  offering: string[];
  /** Every URL here was checked to resolve; Unsplash is allow-listed in next.config.mjs. */
  image: string;
  imageAlt: string;
};

export const segments: Segment[] = [
  {
    id: "play-schools",
    deva: "नन्हे",
    name: "Play schools & early years",
    who: "Pre-primary and daycare, ages 2–6",
    pressure:
      "At this age the work is rarely with the child. It's with exhausted parents, first-time separation anxiety, and teachers holding twenty small nervous systems at once.",
    offering: [
      "Parent counselling and drop-off anxiety clinics",
      "Emotional-regulation training for teachers and helpers",
      "Early-signal guidance — when a behaviour is a phase, and when it isn't",
    ],
    image:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=80",
    imageAlt:
      "Small children sitting together at a low table with crayons and paper",
  },
  {
    id: "schools",
    deva: "पाठशाला",
    name: "Schools",
    who: "Classes 1–12, day and boarding",
    pressure:
      "Board pressure, bullying that now follows students home through a phone, and adolescents who will talk to almost anyone except the counsellor whose office is next to the principal's.",
    offering: [
      "An on-call counsellor students reach on WhatsApp, not by appointment slip",
      "Gatekeeper training so teachers know what to notice and what to say",
      "Parent evenings, and a written protocol for the hard days",
    ],
    image:
      "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=900&q=80",
    imageAlt:
      "Rows of empty wooden desks and chairs in a bright school classroom",
  },
  {
    id: "colleges",
    deva: "महाविद्यालय",
    name: "Colleges & universities",
    who: "UG, PG and residential campuses",
    pressure:
      "First time away from home, hostel loneliness, placement season, breakups, substance use — landing on a counselling cell with one counsellor for four thousand students.",
    offering: [
      "Capacity behind your existing cell, not a replacement for it",
      "Peer-supporter training for student volunteers",
      "Anonymous access, so nobody has to be seen walking in",
    ],
    image:
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=80",
    imageAlt:
      "Students walking across a university campus between lectures",
  },
  {
    id: "institutes",
    deva: "परीक्षा",
    name: "Coaching institutes",
    who: "JEE, NEET, UPSC, CAT and board coaching",
    pressure:
      "The highest-stakes rooms in the country. Rank lists, hostel isolation far from family, and a duty of care that is now under real public and regulatory scrutiny.",
    offering: [
      "Screening at intake and before every major mock cycle",
      "24x7 escalation path with a named clinician on the other end",
      "Faculty training on the language that lowers the stakes instead of raising them",
    ],
    image:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=900&q=80",
    imageAlt:
      "Stacked textbooks and study notes on a desk under a reading lamp",
  },
  {
    id: "companies",
    deva: "कार्यालय",
    name: "Companies & startups",
    who: "From 20-person teams to enterprise",
    pressure:
      "Burnout that reads as attrition, managers improvising through conversations they were never trained for, and an EAP nobody uses because the number sits on an intranet page.",
    offering: [
      "Sessions your team books themselves, in the language they think in",
      "Manager training for the conversation before the resignation",
      "Aggregate wellbeing reporting — patterns, never people",
    ],
    image:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80",
    imageAlt:
      "Colleagues working together around a laptop in an open-plan office",
  },
  {
    id: "organisations",
    deva: "संस्था",
    name: "NGOs & public bodies",
    who: "Field teams, frontline and government programs",
    pressure:
      "Vicarious trauma is an occupational hazard for anyone doing this work, and it is almost never budgeted for until someone breaks.",
    offering: [
      "Debriefing and trauma support built into the work cycle",
      "Supervision groups for field staff and case workers",
      "Grant-friendly scoping and reporting",
    ],
    image:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80",
    imageAlt:
      "A group of field workers standing together in conversation outdoors",
  },
];

/** What every program is assembled from, whoever it's for. */
/**
 * Institution sizes offered in the pack builder. Defined once: the form renders
 * these and the route handler validates against them, so the two can never
 * disagree about what a valid answer looks like.
 */
export const headcounts = [
  "Under 100",
  "100–500",
  "500–2,000",
  "2,000–10,000",
  "10,000+",
] as const;

export type Headcount = (typeof headcounts)[number];

export type Pillar = { id: string; title: string; body: string };

export const pillars: Pillar[] = [
  {
    id: "counselling",
    title: "Counselling that's actually reachable",
    body: "RCI-licensed psychologists, online, in 2+ languages, booked by the person who needs them — no gatekeeper, no form countersigned by a supervisor.",
  },
  {
    id: "manu",
    title: "Manu, on your campus",
    body: "Our WhatsApp companion, set up for your institution. Always awake, speaks Hinglish, and knows when to stop being the hero and hand over to a human.",
  },
  {
    id: "workshops",
    title: "Workshops that aren't assemblies",
    body: "Small-room sessions on exam pressure, burnout, sleep, and asking for help — run by clinicians, not motivational speakers.",
  },
  {
    id: "training",
    title: "Training the people already there",
    body: "Teachers, wardens, managers and peer volunteers learn what to notice, what to say, and exactly where to pass it on.",
  },
  {
    id: "screening",
    title: "Anonymous screening",
    body: "Voluntary check-ins that give you a real picture of the year ahead, so budget and staffing follow evidence instead of anecdote.",
  },
  {
    id: "protocol",
    title: "A crisis protocol in writing",
    body: "Who is called, in what order, within what window — with escalation to Tele-MANAS 14416 and emergency services built in and rehearsed.",
  },
];

export const steps = [
  {
    n: "01",
    title: "A conversation",
    body: "Thirty minutes on what you're seeing and what you've already tried. No deck, no pitch. Often we'll tell you the problem is smaller than you think.",
  },
  {
    n: "02",
    title: "A scoped pilot",
    body: "One cohort, one department, one campus — for a term or a quarter. Priced per seat, with a defined end date so nobody is signing a blind contract.",
  },
  {
    n: "03",
    title: "Rollout",
    body: "What worked gets extended, what didn't gets dropped. Onboarding materials, launch comms and training run by us.",
  },
  {
    n: "04",
    title: "Quarterly review",
    body: "Aggregate patterns, utilisation, and an honest read on what the numbers are and aren't telling you.",
  },
];

export const orgFaqs: Faq[] = [
  {
    q: "Will we see what our students or employees talk about?",
    a: "No, and this is not negotiable. Session content is confidential between the individual and their psychologist, exactly as it would be if they had found us themselves. What you receive is aggregate: how many people used the program, broad themes, and utilisation trends — never names, never transcripts, never a list of who booked. The only exception is the one every clinician works under: a situation of serious, immediate risk to someone's safety, handled through the crisis protocol we agree with you in advance.",
  },
  {
    q: "What does it cost?",
    a: "Programs are priced per seat per year, and the per-seat price falls sharply with size — a 60-student play school and a 4,000-student university are not on the same rate card. Workshops and training can also be bought standalone if you want to start smaller. We will quote against a scope, not a headcount guess, so the first conversation is about what you actually need.",
  },
  {
    q: "We already have a counsellor on campus. Where do you fit?",
    a: "Behind them, usually. One in-house counsellor for a few thousand students is the norm in India and it is not a staffing problem you can solve with one more hire. We take the volume — after-hours contact, routine sessions, language coverage they don't have — so your counsellor can do the work only someone on campus can do. We are not a replacement, and we will say so if someone tries to use us as one.",
  },
  {
    q: "How fast can a program start?",
    a: "A pilot can be running in two to three weeks: scoping call, protocol agreed and signed, therapists assigned to your languages, launch comms out. Crisis escalation is live from day one — that part never waits for a rollout plan.",
  },
  {
    q: "Is this available outside metros?",
    a: "Yes. Everything except in-person workshops runs online, so a school in Ranchi gets the same panel as one in Gurgaon. Sessions are available in 2+ languages, and we match therapists to your region's languages during scoping rather than defaulting everyone to English.",
  },
  {
    q: "Do you work with minors?",
    a: "Yes, with consent handled properly. For students under 18, we work to a consent framework agreed with the institution and parents before launch, and our clinicians working with adolescents are experienced with this age group specifically. We'll walk through exactly how it works in the scoping call — it's usually the first question, and it should be.",
  },
];
