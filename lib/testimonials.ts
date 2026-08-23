export type Testimonial = {
  quote: string;
  name: string;
  detail: string;
  /** Watercolor portrait in /public/reviews. Falls back to a monogram if missing. */
  image?: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "I'd been 'managing' for three years. Six sessions in, I realised managing and living are not the same thing.",
    name: "Priya",
    detail: "27, product designer, Bengaluru",
    image: "/reviews/priya.png",
  },
  {
    quote:
      "My therapist speaks Tamil. The day I stopped translating my feelings into English mid-sentence, everything changed.",
    name: "Karthik",
    detail: "31, software engineer, Chennai",
    image: "/reviews/karthik.png",
  },
  {
    quote:
      "I booked at 1 a.m. during a panic spiral and had a session by evening. That speed probably mattered more than I knew.",
    name: "Ishita",
    detail: "22, final-year student, Delhi",
    image: "/reviews/ishita.png",
  },
  {
    quote:
      "We went in to fix the fighting. We came out actually knowing each other. Eight years married, and this was new.",
    name: "Rahul & Sneha",
    detail: "couples counselling, Pune",
    image: "/reviews/rahul-sneha.png",
  },
  {
    quote:
      "As the eldest daughter, I'd never said some things out loud to anyone. There's a version of me that exists now because someone listened.",
    name: "Fatima",
    detail: "29, chartered accountant, Hyderabad",
    image: "/reviews/fatima.png",
  },
  {
    quote:
      "I thought therapy was for breakdowns. Turns out it works much better slightly before the breakdown.",
    name: "Aditya",
    detail: "34, founder, Gurugram",
    image: "/reviews/aditya.png",
  },
];
