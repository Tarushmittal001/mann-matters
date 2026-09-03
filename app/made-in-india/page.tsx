import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import Accordion from "@/components/ui/Accordion";
import CTABand from "@/components/sections/CTABand";
import { cn } from "@/lib/utils";
import type { Faq } from "@/lib/faqs";
import IndiaOutline from "@/components/visuals/IndiaOutline";

export const metadata: Metadata = {
  title: "Made in India — Built for Indian minds",
  description:
    "Emoraa is built in India, for India: your data stays on Indian servers under the DPDP Act 2023, therapy in your language, and Tele-MANAS 14416 crisis support built in.",
};

const pillars = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <rect x="4.5" y="6" width="19" height="13" rx="2" />
        <path d="M9 23h10M14 19v4M8.5 11h11M8.5 14.5h7" strokeLinecap="round" />
      </svg>
    ),
    title: "Your data stays in India",
    body: "Everything you share is stored on Indian servers, governed by India's Digital Personal Data Protection Act 2023 — never handed to a foreign jurisdiction, never subject to overseas surveillance law.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <circle cx="14" cy="9.5" r="4" />
        <path d="M6.5 23c0-3.6 3.2-6 7.5-6s7.5 2.4 7.5 6" strokeLinecap="round" />
      </svg>
    ),
    title: "Therapists who get the context",
    body: "Joint families, board-exam pressure, arranged-marriage conversations, the weight of “log kya kahenge” — our psychologists live this reality. You never have to translate your life before the help begins.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d="M4 7h12M9 4.5v2.5M11.5 7c0 5-3.5 9-7.5 11M7 12c1.5 2.4 4 4.2 7 5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 23l4.5-10 4.5 10M15.7 19.5h5.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Care in your language",
    body: "Therapy in Hindi and English today, with Marathi, Tamil, Telugu, Kannada and Bengali on the way through 2026. Switch mid-sentence — feelings don't always arrive in one language.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d="M14 24S5 18.5 5 11.5A4.5 4.5 0 0 1 14 9a4.5 4.5 0 0 1 9 2.5C23 18.5 14 24 14 24Z" strokeLinejoin="round" />
        <path d="M14 11v5M11.5 13.5h5" strokeLinecap="round" />
      </svg>
    ),
    title: "Crisis help, built in",
    body: "One tap connects you to Tele-MANAS 14416 — India's government mental-health helpline, free and 24x7, which has answered over 1.8 million calls since 2022. Real help, the moment risk appears.",
  },
];

const rights = [
  { title: "Access", body: "See exactly what we hold about you, any time." },
  { title: "Correction", body: "Fix anything that's wrong or out of date." },
  { title: "Erasure", body: "Ask us to delete your data, and we will." },
  { title: "Grievance", body: "A real person to escalate to if something feels off." },
  { title: "Nomination", body: "Name someone to act for you if you no longer can." },
];

const compareRows: { label: string; mm: boolean | string; intl: boolean | string }[] = [
  { label: "Data stored in India", mm: true, intl: false },
  { label: "Governed by Indian law (DPDP 2023)", mm: true, intl: false },
  { label: "Hindi & Indian-language therapy", mm: true, intl: "Limited" },
  { label: "Understands Indian family & social context", mm: true, intl: false },
  { label: "Tele-MANAS 14416 crisis line built in", mm: true, intl: false },
  { label: "Priced for Indian incomes", mm: "from ₹599", intl: "$$$" },
  { label: "Licensed Indian (RCI) psychologists", mm: true, intl: false },
];

const faqs: Faq[] = [
  {
    q: "Is Emoraa affiliated with the government?",
    a: "No — we're an independent Indian mental-health service. We're not run by, or formally tied to, any government body. Where we do connect is crisis support: when there's serious risk, we point you straight to Tele-MANAS 14416, the Government of India's free national helpline, because in an emergency that's the fastest, most reliable line of help.",
  },
  {
    q: "Where exactly is my data stored, and who can see it?",
    a: "Your data lives on servers in India and is governed by the Digital Personal Data Protection Act 2023. It is encrypted, and what you say in session is never shared with family, employers, or anyone else — the only exceptions being situations of serious, immediate risk that the law and ethics require us to act on. It is never moved to a foreign jurisdiction.",
  },
  {
    q: "Which languages can I have therapy in?",
    a: "Right now, Hindi and English — and you're welcome to switch between them freely within a session. We're expanding to Marathi, Tamil, Telugu, Kannada and Bengali through 2026, so more people can do this work in the language they actually feel in.",
  },
  {
    q: "Are international therapy apps unsafe?",
    a: "Not unsafe — many are good products. But your data sits on foreign servers under foreign law, the cultural context often doesn't fit Indian life, pricing assumes a Western salary, and their crisis resources rarely point to Indian helplines. “Made in India” simply means none of that friction sits between you and the help.",
  },
  {
    q: "Can I delete everything if I want to?",
    a: "Yes. Under the DPDP Act 2023 you have the right to access, correct, and erase your data, to raise a grievance, and to nominate someone to act on your behalf. Email us and we'll action it — no dark patterns, no “are you sure” mazes.",
  },
];

function Mark({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="font-medium text-forest-800">{value}</span>;
  }
  return value ? (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#1A5A4D" strokeWidth="1.8" className="mx-auto" aria-label="Yes">
      <path d="M4 10.5 8 14.5l8-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#9AA29E" strokeWidth="1.6" className="mx-auto" aria-label="No">
      <path d="M4 4l10 10M14 4 4 14" strokeLinecap="round" />
    </svg>
  );
}

export default function MadeInIndiaPage() {
  return (
    <main>
      {/* Hero */}
      <section className="page-top relative overflow-hidden pb-16">
      {/* an outline map of India, tracing itself — click to redraw */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] md:block"
        aria-hidden="true"
      >
        <div
          className="pointer-events-auto h-full w-full opacity-[0.95]"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 16%, black 100%)",
            maskImage:
              "linear-gradient(to right, transparent 0%, black 16%, black 100%)",
          }}
        >
          <IndiaOutline />
        </div>
      </div>
      {/* scrim keeps the headline legible where it meets the canvas */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden w-[58%] md:block"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, #F7F4EE 0%, #F7F4EE 40%, #F7F4EEd9 62%, #F7F4EE00 100%)",
        }}
      />
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 55% 45% at 80% 20%, rgba(168,195,181,0.30), transparent 70%), radial-gradient(ellipse 40% 40% at 10% 90%, rgba(200,164,93,0.12), transparent 70%)",
          }}
        />
        <div className="wrap-wide pointer-events-none relative z-10">
          <Reveal>
            <p className="eyebrow mb-5 flex items-center gap-2.5">
              <span aria-hidden="true">🇮🇳</span>
              built in India, for India
            </p>
            <h1 className="h-display max-w-4xl text-[clamp(2.6rem,7vw,5.5rem)]">
              Mental health works better when it&apos;s{" "}
              <em className="text-forest-600">built for you.</em>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink/75 md:text-xl">
              Not a Western app with a Hindi button bolted on. Emoraa is
              made here — your data on Indian soil, your therapist fluent in your
              world, your crisis line one tap away. This is what India-first care
              actually looks like.
            </p>
            <div className="pointer-events-auto mt-10 flex flex-wrap gap-4">
              <Link
                href="/book"
                className="rounded-full bg-gold px-7 py-3.5 text-[0.95rem] font-semibold text-forest-950 transition-colors duration-300 hover:bg-gold-dark"
              >
                Book a session
              </Link>
              <Link
                href="/about"
                className="rounded-full border border-forest-800/25 px-7 py-3.5 text-[0.95rem] font-semibold text-forest-800 transition-colors duration-300 hover:border-forest-800 hover:bg-forest-800 hover:text-ivory"
              >
                Our story
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Why it matters / digital self-reliance */}
      <section className="section bg-sage-light/30">
        <div className="wrap-wide grid items-start gap-12 lg:grid-cols-[0.8fr_1fr] lg:gap-20">
          <Reveal>
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
              why it matters
            </p>
            <h2 className="h-display text-3xl md:text-4xl">
              Self-reliance isn&apos;t a slogan here. It&apos;s your privacy.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="space-y-6 text-[1.05rem] leading-relaxed text-ink/75">
              <p>
                As India invests in technology built by Indians, for Indians, mental
                healthcare is one of the places it matters most. The things you tell a
                therapist are among the most private words you will ever speak — they
                shouldn&apos;t live on a server in another country, under another
                country&apos;s law.
              </p>
              <p>
                And care itself works better when it fits. A therapist who already
                understands hostel homesickness, the family WhatsApp group, the
                placement-season panic and the quiet shame around &ldquo;needing help&rdquo;
                can meet you faster — because you spend the hour being understood, not
                explaining your context.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Four pillars */}
      <section className="section">
        <div className="wrap-wide">
          <SectionHeading
            eyebrow="india-first, by design"
            deva="मन"
            title="Four ways that being made here changes the care"
            description="Not marketing. These are concrete decisions baked into how Emoraa is built."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={(i % 2) * 0.1}>
                <div className="card-lift flex h-full flex-col rounded-2xl border border-forest-800/10 bg-ivory-light p-8 shadow-lift">
                  <span className="text-forest-600">{p.icon}</span>
                  <h3 className="mt-5 font-display text-[1.4rem] font-medium leading-snug text-forest-900">
                    {p.title}
                  </h3>
                  <p className="mt-3 flex-1 leading-relaxed text-ink/70">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* DPDP Act 2023 */}
      <section className="section bg-forest-950 text-ivory">
        <div className="wrap-wide grid items-start gap-12 lg:grid-cols-[0.85fr_1fr] lg:gap-20">
          <Reveal>
            <p className="eyebrow mb-4 text-sage">the law on your side</p>
            <h2 className="h-display text-3xl text-ivory md:text-4xl">
              The DPDP Act 2023, in plain words
            </h2>
            <p className="mt-5 leading-relaxed text-sage-light/80">
              India&apos;s Digital Personal Data Protection Act gives you real,
              enforceable rights over your own information. We don&apos;t just comply
              with it — we think it&apos;s the right way to treat the things you trust
              us with.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="space-y-3">
              {rights.map((r) => (
                <li
                  key={r.title}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="mt-0.5 shrink-0 text-gold" aria-hidden="true">
                    <path d="M5 12.5 10 17.5l9-11" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <p className="font-display text-lg font-medium text-ivory">{r.title}</p>
                    <p className="text-[0.92rem] text-sage-light/75">{r.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Comparison */}
      <section className="section">
        <div className="wrap">
          <Reveal className="mb-12 max-w-2xl">
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
              side by side
            </p>
            <h2 className="h-display text-4xl md:text-5xl">Emoraa vs. an international app</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="overflow-x-auto rounded-3xl border border-forest-800/10 bg-ivory-light shadow-lift">
              <table className="w-full min-w-[560px] text-left text-[0.95rem]">
                <caption className="sr-only">
                  Comparison of Emoraa with international mental-health apps
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="px-7 py-6 font-medium text-ink/50">What you get</th>
                    <th scope="col" className="px-5 py-6 text-center font-display text-lg font-medium text-forest-900">
                      Emoraa
                    </th>
                    <th scope="col" className="px-5 py-6 text-center font-display text-lg font-medium text-ink/60">
                      International apps
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row, i) => (
                    <tr key={row.label} className={cn(i % 2 === 0 && "bg-sage-light/20")}>
                      <th scope="row" className="px-7 py-4 font-normal text-ink/80">{row.label}</th>
                      <td className="px-5 py-4 text-center"><Mark value={row.mm} /></td>
                      <td className="px-5 py-4 text-center"><Mark value={row.intl} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-sage-light/30">
        <div className="wrap">
          <Reveal className="mb-12 max-w-2xl">
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
              fair questions
            </p>
            <h2 className="h-display text-4xl md:text-5xl">What &ldquo;Made in India&rdquo; really means</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <Accordion items={faqs} />
          </Reveal>
        </div>
      </section>

      <CTABand />
    </main>
  );
}
