import Link from "next/link";

/* A slim highlighted band straight under the hero: "Something bothering you?
   Want to talk?" moving slowly past, with one fixed button to act on it.

   Built the same way as PhraseTicker — two copies of one track sliding by half
   its width, faded at the edges, paused on hover — but on the dark ground, so
   it reads as the page's one standing invitation rather than another reminder.

   **What it offers.** Every person's first session with a licensed
   psychologist is free — one per verified phone number. The button goes to the
   booking flow with that intent (`/book?free=1`), where eligibility is checked
   on the server and the session is confirmed at ₹0 with no payment step. The
   bar promises exactly what the booking flow delivers, and nothing more.

   The button does not scroll. A moving target is hard to tap on a phone, and
   the action should stay where the eye can find it while the words drift.

   Reduced motion is handled in globals.css, which stops `.animate-marquee`. */

const lines: { text: string; accent?: boolean }[] = [
  { text: "Something bothering you?" },
  { text: "Want to talk?", accent: true },
  { text: "Your first session is free" },
  { text: "Kuch pareshaan kar raha hai?" },
  { text: "Baat karni hai?", accent: true },
  { text: "A licensed psychologist, 50 minutes, on us" },
];

export default function TalkBar() {
  return (
    <section
      className="group relative overflow-hidden border-y border-gold/20 bg-forest-950 py-4"
      aria-label="Something bothering you? Your first session with a psychologist is free"
    >
      {/* fade the left edge so lines arrive rather than clip */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-forest-950 to-transparent md:w-24"
        aria-hidden="true"
      />

      <div className="flex w-max animate-marquee [animation-duration:40s] group-hover:[animation-play-state:paused]">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            className="flex shrink-0 items-center"
            aria-hidden={copy === 1 ? "true" : undefined}
          >
            {lines.map((line) => (
              <li key={line.text} className="flex items-center whitespace-nowrap">
                <span
                  className={
                    line.accent
                      ? "font-display text-lg italic text-gold md:text-xl"
                      : "font-display text-lg italic text-ivory/85 md:text-xl"
                  }
                >
                  {line.text}
                </span>
                <span className="mx-8 font-deva text-base text-gold/60" aria-hidden="true">
                  मन
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>

      {/* the one fixed thing on the band: the way in */}
      <div className="absolute inset-y-0 right-0 z-20 flex items-center bg-gradient-to-l from-forest-950 via-forest-950 to-transparent pl-12 pr-3 md:pl-28 md:pr-8">
        <Link
          href="/book?free=1"
          aria-label="Consult now — your first session is free"
          className="group/btn inline-flex items-center gap-2.5 rounded-full bg-gold py-2 pl-2 pr-4 text-[0.88rem] font-semibold text-forest-950 shadow-bloom transition-all duration-300 ease-silk hover:-translate-y-0.5 hover:bg-gold-light md:pr-5 md:text-[0.95rem]"
        >
          <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-900 text-gold">
            {/* a speech bubble — a conversation, not a transaction */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 5.5h16v10H9l-4.5 3.5v-3.5H4z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            {/* someone is there to take it */}
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-gold" />
            </span>
          </span>
          <span>
            Consult now<span className="hidden sm:inline"> — it&apos;s free</span>
          </span>
          <svg
            width="13"
            height="13"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
            className="transition-transform duration-300 ease-silk group-hover/btn:translate-x-0.5"
          >
            <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
