import { services } from "./services";
import { languageList } from "@/lib/languages";

export type Faq = { q: string; a: string };

/**
 * The price answer is read off the catalogue rather than typed in.
 *
 * It was typed in once, and then the prices moved underneath it twice — first
 * when the service became the unit of sale, then again when practitioners were
 * allowed their own rate for a service. Both times the answer went on saying
 * something that had stopped being true. A FAQ that contradicts the booking
 * screen is worse than no FAQ.
 *
 * This file cannot reach the database, so it quotes the standard price as a
 * floor and says plainly that some practitioners charge above it. That is the
 * honest static answer: every number here is one somebody can be booked at,
 * and nothing here claims to be the only number.
 */
const priced = (slug: string) => {
  const s = services.find((x) => x.slug === slug);
  return s?.price != null ? `₹${s.price.toLocaleString("en-IN")}` : null;
};

const priceAnswer = [
  "Your first session is free — a full session with a certified psychologist, one per person.",
  `After that, the price depends on the kind of session: individual therapy from ${priced("individual-therapy")} for 50 minutes, student sessions from ${priced("student-support")}, group sessions from ${priced("group-sessions")}, couples counselling from ${priced("couples-counseling")}.`,
  "More experienced practitioners may charge above those rates, so each therapist's own price is shown on their card and again before you pay. Nothing is ever charged that you have not already seen.",
  "No subscriptions, no hidden charges, free rescheduling with 24 hours' notice.",
].join(" ");

export const faqs: Faq[] = [
  {
    q: "Is everything I say really confidential?",
    a: "Yes. What you share stays between you and your therapist. We never share what happens in a session with your family, your employer, or anyone else. There is one exception, and your therapist will explain it in your first session. If there is a serious and immediate risk to your safety or someone else's, the law and our ethics require us to act.",
  },
  {
    q: "How much does a session cost?",
    a: priceAnswer,
  },
  {
    q: "Can I do therapy in my own language?",
    a: `Yes — and we would encourage it. Our therapists work in ${languageList()}. Feelings are easier to find in the language you think in. You can filter by language when choosing your therapist.`,
  },
  {
    q: "How do online sessions work?",
    a: "After you book, you get a private video link on WhatsApp and email. At your session time, open it from any phone or laptop — no app to download. You need a quiet spot, earphones, and a decent connection. Most clients tell us the screen stops mattering about ten minutes into the first session.",
  },
  {
    q: "How do I know my therapist is qualified?",
    a: "Every therapist on Emoraa holds a master's degree or higher in clinical or counselling psychology. Before they see a single client, we check their qualifications, their registrations where they hold one, and their supervised experience. Their qualifications are listed on their profile, so you always know who you are talking to.",
  },
  {
    q: "What if I'm in crisis right now?",
    a: "Please don't wait for an appointment. Call Tele-MANAS at 14416 — the Government of India's free, confidential mental health helpline, available 24x7 in 20+ languages. If you or someone near you is in immediate danger, call 112. Emoraa provides scheduled therapy, and a crisis deserves faster care than any booking system can give.",
  },
];
