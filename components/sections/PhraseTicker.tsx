/* A slim band of small true things, moving slowly past — so the page never
   fully settles, and so something lands even if the visitor reads only one.

   Written to earn a second glance rather than nod past: each line carries an
   image (weather, city traffic, a missed call, chai) and turns in its second
   half. Kept short on purpose — this scrolls, so a line has about two seconds
   to be understood.

   `deva` marks Devanagari: Fraunces carries no Devanagari glyphs and no real
   italic for them, so those lines render in the brand's Tiro face, upright. */
const phrases: { text: string; deva?: boolean }[] = [
  { text: "“मन भी मौसम है — बदलेगा।”", deva: true },
  { text: "“Tu chai hai, instant coffee nahi.”" },
  { text: "“Your mind is not a room you must clean alone.”" },
  { text: "“आँसू भी भाषा हैं।”", deva: true },
  { text: "“Dil ka traffic bhi clear hota hai.”" },
  { text: "“Feelings are visitors — some forget to leave.”" },
  { text: "“जो कहा नहीं गया, वो गया नहीं।”", deva: true },
  { text: "“Sab sambhaalne wale ko bhi sambhaal chahiye.”" },
  { text: "“Some days, breathing is the achievement.”" },
  { text: "“अंधेरे को भी नींद आती है।”", deva: true },
  { text: "“Ek missed call se bhi baat shuru hoti hai.”" },
];

export default function PhraseTicker() {
  return (
    <section
      className="group relative overflow-hidden border-y border-forest-800/10 bg-ivory-dark/60 py-5"
      aria-label="Small reminders"
    >
      {/* fade the edges so phrases arrive and leave, rather than clip */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ivory-dark to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ivory-dark to-transparent"
        aria-hidden="true"
      />

      {/* the shared 48s tempo was tuned for a shorter list; a longer track at the
          same duration scrolls faster, so it's stretched to keep the reading pace */}
      <div className="flex w-max animate-marquee [animation-duration:66s] group-hover:[animation-play-state:paused]">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            className="flex shrink-0 items-center"
            aria-hidden={copy === 1 ? "true" : undefined}
          >
            {phrases.map((phrase) => (
              <li key={phrase.text} className="flex items-center whitespace-nowrap">
                <span
                  className={
                    phrase.deva
                      ? "font-deva text-lg text-forest-800/70 md:text-xl"
                      : "font-display text-lg italic text-forest-800/70 md:text-xl"
                  }
                  lang={phrase.deva ? "hi" : undefined}
                >
                  {phrase.text}
                </span>
                <span className="mx-8 font-deva text-base text-gold/70" aria-hidden="true">
                  मन
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
