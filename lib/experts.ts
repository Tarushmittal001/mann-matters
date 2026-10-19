import type { Profession } from "@/lib/professions";

export type Expert = {
  id: string;
  name: string;
  credentials: string;
  /** Declared by an admin — see lib/professions.ts. Decides who can prescribe. */
  profession: Profession;
  /** Registration or membership number. Required for a live psychiatrist; optional for everyone else. */
  registrationNo: string;
  /**
   * Which register the number above is on: "RCI", "NMC", "STATE", or "".
   *
   * Per practitioner, never a claim about the group. Emoraa does not require
   * a council registration, so the site says its psychologists are certified
   * and shows the register only on the profile of someone who is on one.
   */
  registrationBody: string;
  experience: string;
  languages: string[];
  specialties: string[];
  /** Service slugs this practitioner may be booked for. Empty = not bookable. */
  services: string[];
  /** Their own words, for the public profile. Often empty — never rely on it. */
  bio: string;
  /**
   * What this practitioner charges, per service slug — overrides only.
   *
   * A slug missing from here is charged at the service's standard price, which
   * is why it is a sparse map and not a full table. Ticking a service is
   * therefore enough to make it sellable: no service can end up qualified-for
   * but unpriced, which is the exact state that once made ₹399, ₹599 and ₹799
   * unbuyable on a site that advertised all three.
   */
  servicePrices: Record<string, number>;
  /**
   * Historical. Sessions have never been charged at this rate since the service
   * became the unit of sale, and it is no longer shown or editable — see
   * lib/service-catalogue.ts. Kept so old rates are not lost.
   */
  price: number;
  rating: number;
  photo: string;
};

/**
 * The six therapists the site launched with.
 *
 * The live catalogue now lives in the database (lib/experts-store.ts) so an
 * admin can edit it; this list is only the seed for a database that has none
 * yet, and the shape the rest of the site codes against.
 */
export const seedExperts: Omit<
  Expert,
  "profession" | "registrationNo" | "registrationBody"
>[] = [
  {
    id: "ananya-iyer",
    name: "Ananya Iyer",
    credentials: "M.Phil. Clinical Psychology",
    experience: "9 years",
    languages: ["English", "Hindi", "Tamil"],
    specialties: ["Anxiety", "Workplace stress", "Self-esteem"],
    services: ["individual-therapy", "daily-life-stress", "career-counselling"],
    bio: "",
    servicePrices: {},
    price: 1199,
    rating: 4.9,
    photo:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "kabir-shah",
    name: "Dr. Kabir Shah",
    credentials: "Ph.D. Counselling Psychology",
    experience: "12 years",
    languages: ["English", "Hindi", "Gujarati"],
    specialties: ["Relationships", "Couples therapy", "Grief"],
    services: ["individual-therapy", "couples-counseling", "love-life-counselling", "family-therapy", "grief-loss"],
    bio: "",
    servicePrices: {},
    price: 1499,
    rating: 4.9,
    photo:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "meera-krishnan",
    name: "Meera Krishnan",
    credentials: "M.A. Clinical Psychology",
    experience: "7 years",
    languages: ["English", "Malayalam", "Kannada"],
    specialties: ["Student stress", "Exam anxiety", "Sleep"],
    services: ["student-support", "sleep-programme", "individual-therapy"],
    bio: "",
    servicePrices: {},
    price: 899,
    rating: 4.9,
    photo:
      "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "arjun-mehta",
    name: "Arjun Mehta",
    credentials: "M.Sc. Psychology, Dip. CBT",
    experience: "6 years",
    languages: ["English", "Hindi", "Marathi"],
    specialties: ["Career anxiety", "Burnout", "Life transitions"],
    services: ["career-counselling", "daily-life-stress", "individual-therapy"],
    bio: "",
    servicePrices: {},
    price: 999,
    rating: 4.8,
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "sana-qureshi",
    name: "Sana Qureshi",
    credentials: "M.Phil. Clinical Psychology",
    experience: "10 years",
    languages: ["English", "Hindi", "Urdu"],
    specialties: ["Depression", "Family expectations", "Women's mental health"],
    services: ["individual-therapy", "family-therapy", "parent-coaching", "grief-loss"],
    bio: "",
    servicePrices: {},
    price: 1299,
    rating: 5.0,
    photo:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "rohan-nair",
    name: "Rohan Nair",
    credentials: "M.A. Counselling Psychology",
    experience: "5 years",
    languages: ["English", "Malayalam", "Hindi"],
    specialties: ["Sleep", "Anxiety", "Mindfulness-based therapy"],
    services: ["sleep-programme", "individual-therapy", "daily-life-stress"],
    bio: "",
    servicePrices: {},
    price: 849,
    rating: 4.9,
    photo:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
  },
];

export const concerns = [
  {
    id: "anxiety",
    label: "Anxiety",
    hint: "Worry that won't switch off, overthinking, panic",
  },
  {
    id: "stress",
    label: "Stress & burnout",
    hint: "Always tired, always behind, never enough",
  },
  {
    id: "relationships",
    label: "Relationships",
    hint: "Partners, family, friendships, loneliness",
  },
  {
    id: "career",
    label: "Career & studies",
    hint: "Exams, placements, work pressure, what next",
  },
  {
    id: "sleep",
    label: "Sleep",
    hint: "Can't fall asleep, can't stay asleep, never rested",
  },
  {
    id: "other",
    label: "Something else",
    hint: "Not sure what to call it — that's okay too",
  },
] as const;

export type ConcernId = (typeof concerns)[number]["id"];

export const timeSlots = [
  { group: "Morning", slots: ["08:00", "09:00", "10:00", "11:00"] },
  { group: "Afternoon", slots: ["12:30", "14:00", "15:30", "16:30"] },
  { group: "Evening", slots: ["18:00", "19:00", "20:00", "21:00"] },
];
