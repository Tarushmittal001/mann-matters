export const site = {
  name: "Emoraa",
  tagline: "Your emotions matter.",
  // the one canonical address; emoraa.in and www. redirect here (next.config.mjs)
  url: "https://emoraa.com",
  email: "connect@emoraa.com",
  /**
   * The one word the site uses for its practitioners.
   *
   * Three were in circulation — "qualified" (20 places), "verified" (1) and
   * "licensed" (PRODUCT.md) — and they do not mean the same thing. It reads
   * from here so there is one answer and one edit.
   *
   * The site says its practitioners are **certified**: a postgraduate
   * qualification we have checked. It deliberately does not say the group is
   * council-registered, because Emoraa does not require that — and
   * "licensed" is read in India as exactly that claim, which is why it is not
   * used either.
   *
   * A practitioner who IS on a council register shows it on their own
   * profile, from `registrationBody` + `registrationNo`. Per person, where it
   * is true; never as a claim about everyone.
   */
  practitionerWord: "certified",
  phone: "+91 86305 65756",
  // A different number on purpose: the official line above has no WhatsApp yet, so
  // chats go to +91 90270 44817 for now. Point this at the official number once it does.
  whatsapp:
    "https://wa.me/919027044817?text=Hi%20Emoraa%2C%20I%27d%20like%20to%20book%20a%20session",
  /**
   * Where emoraa.com/join sends practitioners who want to apply (the Google Form).
   * Printed brochures carry a QR code for /join, never this address, so it can
   * change without a reprint. Empty until the form exists: /join falls back to /contact.
   */
  practitionerForm: "",
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

/** Every page in the top navigation, in order. The footer lists all of them. */
export const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/for-organisations", label: "For institutions" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/made-in-india", label: "Made in India" },
  { href: "/contact", label: "Contact" },
];

/**
 * What the navbar shows outright: the two things people arrive wanting, next to
 * the free tools and the booking button. Everything else moved into "More" —
 * seven equal links read as a wall, and the ones that matter got lost in it.
 */
export const primaryNav = [
  { href: "/services", label: "Services" },
  { href: "/for-organisations", label: "For institutions" },
  { href: "/blog", label: "Blog" },
];

/** The rest, behind "More": read when someone is deciding, not when booking. */
export const moreNav = [
  {
    href: "/therapists",
    label: "Our care team",
    desc: "The psychologists and psychiatrists you'd see",
  },
  { href: "/about", label: "About", desc: "Who we are, and why we built this" },
  { href: "/made-in-india", label: "Made in India", desc: "Built here, for here" },
  { href: "/contact", label: "Contact", desc: "Talk to a real person" },
  { href: "/crisis", label: "Crisis support", desc: "Helplines, free and 24x7" },
];

export const toolLinks = [
  { href: "/tools/burnout", label: "Burnout check", desc: "Burnout, or a bad week?" },
  { href: "/breathe", label: "Take a breath", desc: "1-minute guided breathing" },
  { href: "/tools/grounding", label: "5-4-3-2-1 grounding", desc: "Anchor an anxious mind" },
  { href: "/tools/relax", label: "Muscle relaxation", desc: "Tense & release, head to toe" },
  { href: "/tools/sounds", label: "Calming sounds", desc: "Rain, river, tanpura drone" },
  { href: "/tools/affirmations", label: "Affirmations", desc: "Small true things, हिंदी + English" },
  { href: "/tools/journal", label: "Worry journal", desc: "Write it out, let it go" },
  { href: "/tools/bmi", label: "BMI calculator", desc: "A number in context, not a verdict" },
  { href: "/check-in", label: "Mood check-in", desc: "A 2-minute reflection" },
  { href: "/match", label: "Find your therapist", desc: "Your match in 3 questions" },
  { href: "/tools", label: "All free tools", desc: "Everything in one place" },
];

/**
 * Homepage trust strip. Every number here must be one we can prove today —
 * an invented count or rating is a misleading claim under consumer law. The
 * strip also has drawings for "sessions", "psychologists" and "rating"; add
 * those back (with real figures) once there are records to back them.
 */
export const stats: {
  kind: "sessions" | "psychologists" | "languages" | "rating";
  value: number;
  suffix: string;
  label: string;
  decimals?: number;
}[] = [{ kind: "languages", value: 2, suffix: "+", label: "languages" }];
