export type TherapyLandingPage = {
  slug: string;
  kind: "city" | "language";
  name: string;
  title: string;
  description: string;
  eyebrow: string;
  introduction: string;
  image: string;
  imageAlt: string;
  language?: string;
  realities: Array<{ title: string; body: string }>;
  faqs: Array<{ q: string; a: string }>;
};

export const therapyPages: TherapyLandingPage[] = [
  {
    slug: "delhi",
    kind: "city",
    name: "Delhi",
    title: "Online therapy in Delhi",
    description: "Confidential online therapy for people across Delhi NCR, with licensed Indian psychologists and evening or weekend appointments.",
    eyebrow: "online care · Delhi NCR",
    introduction: "A long commute should not stand between you and a useful conversation. Meet a licensed Indian psychologist online from Delhi, Noida, Gurugram, Ghaziabad, or wherever the day has left you.",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "India Gate in Delhi in warm evening light",
    realities: [
      { title: "No cross-city commute", body: "Join from home or another private place instead of planning around traffic and waiting rooms." },
      { title: "After-work options", body: "Evening and weekend availability makes care easier to fit around office, college, and family schedules." },
      { title: "Culturally familiar", body: "Talk about family expectations, work pressure, relationships, and identity without translating the context first." },
    ],
    faqs: [
      { q: "Do you have a clinic in Delhi?", a: "Sessions are online. You can join from anywhere in Delhi NCR using a private video link, with no app download." },
      { q: "Can I book after office hours?", a: "Availability varies by psychologist, with evening and weekend times shown live during booking." },
      { q: "Is online therapy confidential?", a: "Sessions use a private joining link and your booking information is visible only where needed to deliver your care." },
    ],
  },
  {
    slug: "mumbai",
    kind: "city",
    name: "Mumbai",
    title: "Online therapy in Mumbai",
    description: "Online counselling for Mumbai's work pressure, relationships, burnout, and everyday emotional wellbeing.",
    eyebrow: "online care · Mumbai",
    introduction: "In a city where time and space are both expensive, therapy can still have a regular place in your week. Join online from home, work, or a quiet corner without adding another journey.",
    image: "https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Mumbai shoreline and skyline beside the Arabian Sea",
    realities: [
      { title: "Built around full days", body: "Choose from available evening and weekend appointments instead of losing hours to travel." },
      { title: "Work without the performance", body: "Bring burnout, ambition, uncertainty, or the exhaustion of always appearing capable." },
      { title: "Private by design", body: "Join through a private link and choose what you share, at a pace agreed with your psychologist." },
    ],
    faqs: [
      { q: "Can I attend from outside Mumbai?", a: "Yes. Emoraa sessions are online and available across India." },
      { q: "What if I share a home?", a: "Headphones, a parked car, a quiet office room, or a walk-and-talk audio session may help; discuss privacy needs with your therapist." },
      { q: "How soon can I find a session?", a: "The booking calendar shows current availability. Many people find a suitable time within a few days." },
    ],
  },
  {
    slug: "bengaluru",
    kind: "city",
    name: "Bengaluru",
    title: "Online therapy in Bengaluru",
    description: "Confidential online therapy in Bengaluru for burnout, anxiety, relationships, sleep, and life transitions.",
    eyebrow: "online care · Bengaluru",
    introduction: "Growth can be exciting and still cost more than you expected. Online therapy offers a consistent hour for burnout, uncertainty, relationships, sleep, or the loneliness that can sit beneath a very busy life.",
    image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Bengaluru city seen through green trees",
    realities: [
      { title: "Support for high-pressure work", body: "Explore burnout, imposter feelings, difficult teams, career transitions, and boundaries without reducing everything to productivity." },
      { title: "A steady appointment", body: "Online sessions remove the commute and make continuity easier during travel or hybrid work." },
      { title: "More than work", body: "Relationships, belonging, family, identity, grief, and sleep are welcome even when your calendar says work is the problem." },
    ],
    faqs: [
      { q: "Is online therapy effective for burnout?", a: "Online therapy can provide the same structured conversation and evidence-based approaches as in-person care for many common concerns." },
      { q: "Can I switch psychologists?", a: "Yes. Therapeutic fit matters, and changing psychologists is a normal option." },
      { q: "Are sessions available on weekends?", a: "Some psychologists offer weekend times. Current availability appears in the booking calendar." },
    ],
  },
  {
    slug: "hindi",
    kind: "language",
    name: "Hindi",
    title: "Online therapy in Hindi",
    description: "Talk to an Indian psychologist in Hindi or naturally move between Hindi and English during online therapy.",
    eyebrow: "therapy in your language · हिंदी",
    introduction: "Feelings do not always arrive in the language you use at work. Choose a psychologist who speaks Hindi, and move naturally between Hindi and English without stopping to translate yourself.",
    image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "A person having a thoughtful conversation in a quiet room",
    language: "Hindi",
    realities: [
      { title: "Speak as you think", body: "Use Hindi, English, or both in the same sentence. The goal is understanding, not perfect vocabulary." },
      { title: "Less context-setting", body: "Discuss family roles, shaadi, career pressure, and log kya kahenge with someone familiar with the cultural frame." },
      { title: "Choose by fit", body: "Language matters, but so do concern, approach, availability, and the sense that you can be honest with this person." },
    ],
    faqs: [
      { q: "Can I use Hinglish in therapy?", a: "Yes. You can move between Hindi and English naturally; you do not need to choose one language for the whole session." },
      { q: "Are all psychologists fluent in Hindi?", a: "No. Choose a psychologist whose profile lists Hindi; the language page shows matching options." },
      { q: "Will my family know I booked?", a: "Adult therapy is confidential. Booking and session information is not shared with family without your permission, except where immediate safety requires action." },
    ],
  },
  {
    slug: "tamil",
    kind: "language",
    name: "Tamil",
    title: "Online therapy in Tamil",
    description: "Private online therapy with a psychologist who speaks Tamil, available from anywhere in India.",
    eyebrow: "therapy in your language · தமிழ்",
    introduction: "Some experiences become flatter when translated. A Tamil-speaking psychologist can meet the words, family context, and emotional shorthand that already belong to you.",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Two people in a calm conversation outdoors",
    language: "Tamil",
    realities: [
      { title: "Tamil or English", body: "Use either language or switch between them as the conversation changes." },
      { title: "Context without a lecture", body: "Family responsibilities, relationships, work, and community can be discussed without first explaining every cultural reference." },
      { title: "Online across India", body: "Language access does not depend on finding the right clinic in your neighbourhood." },
    ],
    faqs: [
      { q: "Can the entire session be in Tamil?", a: "Yes, when you book a psychologist whose profile lists Tamil." },
      { q: "Can I attend from outside Tamil Nadu?", a: "Yes. Sessions are online and can be joined from anywhere in India." },
      { q: "How do I choose the right psychologist?", a: "Start with language, then compare specialties, experience, availability, and price. You can change if the fit is not right." },
    ],
  },
  {
    slug: "malayalam",
    kind: "language",
    name: "Malayalam",
    title: "Online therapy in Malayalam",
    description: "Online counselling in Malayalam with Indian psychologists for anxiety, stress, sleep, and life changes.",
    eyebrow: "therapy in your language · മലയാളം",
    introduction: "Therapy can feel more direct when the language carries the same memories and meanings you do. Meet a Malayalam-speaking psychologist online, wherever you currently live.",
    image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Friends talking together in warm evening light",
    language: "Malayalam",
    realities: [
      { title: "No forced translation", body: "Describe feelings, family conversations, and everyday experiences in Malayalam, English, or both." },
      { title: "Care across distance", body: "Continue with a familiar language even if study, work, or migration has taken you elsewhere in India." },
      { title: "A private pace", body: "The first session is a conversation about what you need and whether the therapist feels right for you." },
    ],
    faqs: [
      { q: "Is Malayalam therapy available online?", a: "Yes. Select a psychologist who lists Malayalam and choose an available video-session time." },
      { q: "Can I switch between Malayalam and English?", a: "Yes. Mixed-language conversation is welcome when both languages are listed by your psychologist." },
      { q: "Do I need a diagnosis to book?", a: "No. You can begin with a concern, a difficult period, or simply the feeling that you need somewhere to talk." },
    ],
  },
];

export function getTherapyPage(slug: string) {
  return therapyPages.find((page) => page.slug === slug);
}