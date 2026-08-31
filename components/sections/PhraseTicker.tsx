/* A slim band of the things people actually say before they say the real
   thing. It keeps moving, so the page never fully settles. */
const phrases = [
  "“Bas thoda stress hai, ho jayega”",
  "“Sona nahi aa raha, teen din se”",
  "“Sabko lagta hai main theek hoon”",
  "“Ghar pe bataunga toh tension le lenge”",
  "“I don't know why I'm crying”",
  "“Result aane wala hai”",
  "“Log kya kahenge”",
  "“Kisi se baat karne ka mann nahi”",
];

export default function PhraseTicker() {
  return (
    <section
      className="group relative overflow-hidden border-y border-forest-800/10 bg-ivory-dark/60 py-5"
      aria-label="Things people tell us"
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

      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            className="flex shrink-0 items-center"
            aria-hidden={copy === 1 ? "true" : undefined}
          >
            {phrases.map((phrase) => (
              <li key={phrase} className="flex items-center whitespace-nowrap">
                <span className="font-display text-lg italic text-forest-800/70 md:text-xl">
                  {phrase}
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
