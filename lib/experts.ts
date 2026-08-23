export type Expert = {
  id: string;
  name: string;
  credentials: string;
  experience: string;
  languages: string[];
  specialties: string[];
  price: number;
  rating: number;
  photo: string;
};

export const experts: Expert[] = [
  {
    id: "ananya-iyer",
    name: "Ananya Iyer",
    credentials: "M.Phil. Clinical Psychology, RCI Licensed",
    experience: "9 years",
    languages: ["English", "Hindi", "Tamil"],
    specialties: ["Anxiety", "Workplace stress", "Self-esteem"],
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
    price: 1499,
    rating: 4.8,
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
    price: 999,
    rating: 4.7,
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "sana-qureshi",
    name: "Sana Qureshi",
    credentials: "M.Phil. Clinical Psychology, RCI Licensed",
    experience: "10 years",
    languages: ["English", "Hindi", "Urdu"],
    specialties: ["Depression", "Family expectations", "Women's mental health"],
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
    price: 849,
    rating: 4.8,
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
