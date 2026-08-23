export const site = {
  name: "mann Matters",
  tagline: "Your mind matters. mann Matters.",
  url: "https://mannmatters.in",
  email: "hello@mannmatters.in",
  phone: "+91 90270 44817",
  whatsapp:
    "https://wa.me/919027044817?text=Hi%20mann%20Matters%2C%20I%27d%20like%20to%20book%20a%20session",
  location: "Noida, India — sessions online, everywhere",
  crisisNote:
    "If you're in crisis or thinking about harming yourself, please don't wait for an appointment. Call Tele-MANAS at 14416 — free, confidential, 24x7, in 20+ Indian languages.",
};

/** Verified Indian crisis & emergency helplines, surfaced on /crisis. */
export type Helpline = {
  name: string;
  number: string;
  dial: string;
  hours: string;
  note: string;
  primary?: boolean;
};

export const helplines: Helpline[] = [
  {
    name: "Tele-MANAS",
    number: "14416",
    dial: "14416",
    hours: "24x7",
    note: "Government of India's mental health helpline — free, confidential, in 20+ Indian languages.",
    primary: true,
  },
  {
    name: "Emergency services",
    number: "112",
    dial: "112",
    hours: "24x7",
    note: "Police, ambulance and fire. Call if you or someone near you is in immediate physical danger.",
    primary: true,
  },
  {
    name: "KIRAN Mental Health",
    number: "1800-599-0019",
    dial: "18005990019",
    hours: "24x7",
    note: "National toll-free helpline for distress, anxiety, and suicidal thoughts.",
  },
  {
    name: "Vandrevala Foundation",
    number: "9999 666 555",
    dial: "9999666555",
    hours: "24x7",
    note: "Free counselling and crisis support over call and WhatsApp.",
  },
  {
    name: "iCall (TISS)",
    number: "9152 987 821",
    dial: "9152987821",
    hours: "Mon–Sat, 8am–10pm",
    note: "Email and phone counselling from trained mental-health professionals.",
  },
  {
    name: "AASRA",
    number: "9820 466 726",
    dial: "9820466726",
    hours: "24x7",
    note: "Suicide prevention and emotional support helpline.",
  },
  {
    name: "Women Helpline",
    number: "181",
    dial: "181",
    hours: "24x7",
    note: "Support for women facing violence, abuse, or distress.",
  },
  {
    name: "Childline",
    number: "1098",
    dial: "1098",
    hours: "24x7",
    note: "Help for children and adolescents in distress or danger.",
  },
];

export const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/for-organisations", label: "For institutions" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/made-in-india", label: "Made in India" },
  { href: "/contact", label: "Contact" },
];

export const toolLinks = [
  { href: "/breathe", label: "Take a breath", desc: "1-minute guided breathing" },
  { href: "/tools/grounding", label: "5-4-3-2-1 grounding", desc: "Anchor an anxious mind" },
  { href: "/tools/relax", label: "Muscle relaxation", desc: "Tense & release, head to toe" },
  { href: "/tools/sounds", label: "Calming sounds", desc: "Rain, river, tanpura drone" },
  { href: "/tools/affirmations", label: "Affirmations", desc: "Small true things, हिंदी + English" },
  { href: "/tools/sleep", label: "Sleep wind-down", desc: "A 5-minute bedtime body scan" },
  { href: "/tools/journal", label: "Worry journal", desc: "Write it out, let it go" },
  { href: "/tools/bmi", label: "BMI calculator", desc: "A number in context, not a verdict" },
  { href: "/check-in", label: "Mood check-in", desc: "A 2-minute reflection" },
  { href: "/match", label: "Find your therapist", desc: "Your match in 3 questions" },
  { href: "/tools", label: "All free tools", desc: "Everything in one place" },
];

export const stats = [
  { value: 12000, suffix: "+", label: "sessions delivered" },
  { value: 60, suffix: "+", label: "certified psychologists" },
  { value: 2, suffix: "+", label: "languages" },
  { value: 4.9, suffix: "/5", label: "average session rating", decimals: 1 },
];
