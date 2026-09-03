import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import WhatsAppChat from "@/components/sections/WhatsAppChat";
import { site } from "@/lib/site";

/* Always-on chat features — the everyday companion */
const chatFeatures = [
  {
    title: "Talks how you talk",
    body: "Hinglish, Hindi, ya pure English — switch mid-sentence and it keeps up, Gen-Z slang and all. It quietly reads the mood behind your words, so when stress or anxiety creeps in, it offers a CBT or DBT prompt — a breathing exercise, a reframe — instead of a lecture.",
  },
  {
    title: "Anonymous, if you want",
    body: "Say the word at the start and nothing is stored — no name, no number. Just a stigma-free space to vent at 2 a.m. without anyone, ever, knowing it was you.",
  },
  {
    title: "Mood, tracked gently",
    body: "A daily “Mood aaj?” check-in, nothing more. Over weeks it draws the pattern back to you in a simple carousel — the dips, the climbs, the things that move the needle.",
  },
];

/* Gamification — keeps you coming back */
const engagement = [
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d="M9 11.5 12.5 15l7-7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23.5 14a9.5 9.5 0 1 1-4.2-7.9" strokeLinecap="round" />
      </svg>
    ),
    title: "Daily check-ins & quizzes",
    body: "Three quick questions on how you're really doing, with a tip tuned to your answer. A gentle WhatsApp nudge means you never have to remember.",
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d="M14 3.5c1.6 3.4 4.3 4.2 4.3 7.5A4.3 4.3 0 0 1 14 15.3a4.3 4.3 0 0 1-4.3-4.3c0-3.3 2.7-4.1 4.3-7.5Z" strokeLinejoin="round" />
        <path d="M8 18.5h12M9.5 22.5h9" strokeLinecap="round" />
      </svg>
    ),
    title: "Streaks & badges",
    body: "Seven days in a row unlocks a Bronze badge. Keep going for custom memes and anonymous peer leaderboards — proof you showed up for yourself.",
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d="M6 4v15M6 4h14l-2.5 4L20 12H6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="6" cy="23" r="1.6" />
      </svg>
    ),
    title: "Challenges & levels",
    body: "Weekly goals like “share 3 wins for Silver” unlock peer chats and premium tips. Small quests that, week on week, build a habit that sticks.",
  },
];

/* Support & escalation — the safety net */
const support = [
  {
    title: "CBT & DBT tools, in your pocket",
    body: "Guided gratitude journaling, cognitive restructuring, grounding exercises — all walked through with interactive buttons, one tap at a time. The same techniques therapists use, available the moment you need them.",
  },
  {
    title: "A real psychologist, when it matters",
    body: "If the conversation turns to thoughts of self-harm, the bot doesn't try to be the hero. It connects you to our in-house, RCI-licensed psychologists for a paid consultation — a human, qualified and ready.",
  },
];

export default function WhatsAppCompanion() {
  return (
    <section className="section bg-forest-950 text-ivory">
      <div className="wrap-wide">
        <SectionHeading
          eyebrow="on whatsapp, 24x7"
          deva="मन"
          title="A companion that lives in your chats"
          description="No new app, no waiting room. Emoraa meets you right inside WhatsApp — to listen, to nudge, and to know when to hand you to a human."
          dark
        />

        <div className="grid items-start gap-14 lg:grid-cols-[0.85fr_1fr] lg:gap-20">
          {/* Live, 3D WhatsApp chat */}
          <Reveal>
            <WhatsAppChat />
          </Reveal>

          {/* Always-on chat features */}
          <div className="space-y-9">
            {chatFeatures.map((f, i) => (
              <Reveal key={f.title} delay={0.1 + i * 0.1}>
                <div className="flex gap-5">
                  <span className="gold-rule mt-4 shrink-0" aria-hidden="true" />
                  <div>
                    <h3 className="font-display text-xl font-medium text-ivory">{f.title}</h3>
                    <p className="mt-2 max-w-lg leading-relaxed text-sage-light/80">{f.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Engagement & gamification */}
        <div className="mt-24 md:mt-32">
          <Reveal>
            <p className="eyebrow mb-8 text-sage">stay engaged</p>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {engagement.map((e, i) => (
              <Reveal key={e.title} delay={i * 0.1}>
                <div className="card-lift flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-7">
                  <span className="text-gold">{e.icon}</span>
                  <h3 className="mt-5 font-display text-[1.3rem] font-medium leading-snug text-ivory">
                    {e.title}
                  </h3>
                  <p className="mt-3 flex-1 text-[0.92rem] leading-relaxed text-sage-light/75">
                    {e.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Support & escalation */}
        <div className="mt-24 md:mt-32">
          <Reveal>
            <p className="eyebrow mb-8 text-sage">support &amp; escalation</p>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-2">
            {support.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.1}>
                <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-8">
                  <h3 className="font-display text-2xl font-medium leading-snug text-ivory">{s.title}</h3>
                  <p className="mt-3 flex-1 leading-relaxed text-sage-light/80">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Crisis note */}
          <Reveal delay={0.15}>
            <div className="mt-6 flex items-start gap-4 rounded-2xl border border-gold/30 bg-gold/[0.07] px-6 py-5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mt-0.5 shrink-0 text-gold" aria-hidden="true">
                <path d="M12 8v5M12 16.5v.5" strokeLinecap="round" />
                <path d="M12 3 2.5 20h19L12 3Z" strokeLinejoin="round" />
              </svg>
              <p className="text-[0.92rem] leading-relaxed text-sage-light/85">
                In a genuine emergency, the bot escalates straight to{" "}
                <strong className="font-semibold text-ivory">Tele-MANAS at 14416</strong> — free,
                confidential, 24x7, in 20+ Indian languages. It&apos;s reserved for real crises only,
                so help is never crowded out.
              </p>
            </div>
          </Reveal>
        </div>

        {/* CTA */}
        <Reveal delay={0.1}>
          <div className="mt-16 text-center">
            <a
              href={site.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="card-lift inline-flex items-center gap-3 rounded-full bg-gold px-8 py-4 font-medium text-forest-950 shadow-bloom"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2c-5.5 0-9.94 4.44-9.94 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.49 0 9.94-4.44 9.94-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.16c-.24.68-1.42 1.32-1.96 1.36-.5.05-1.14.07-1.84-.11-.42-.13-.97-.31-1.66-.61-2.93-1.26-4.84-4.2-4.99-4.4-.14-.2-1.19-1.58-1.19-3.02 0-1.43.75-2.13 1.02-2.43.27-.29.58-.36.78-.36l.55.01c.18 0 .42-.07.65.5.24.59.82 2.02.89 2.17.07.14.12.31.02.5-.09.2-.14.31-.28.48-.14.16-.29.37-.42.49-.14.14-.28.29-.12.57.16.27.71 1.17 1.53 1.9 1.05.93 1.93 1.22 2.21 1.36.27.14.43.12.59-.07.16-.2.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.61.76 1.88.9.27.14.46.2.53.32.07.11.07.66-.17 1.34Z" />
              </svg>
              Start chatting on WhatsApp
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
