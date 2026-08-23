/* A slim band of the things people actually say before they say the real
   thing. Each line gets its own colour off the palette, so the band reads
   as a moving strip of gulaal rather than a row of grey text. It keeps
   moving, so the page never fully settles. */
const phrases = [
  { text: "“Bas thoda stress hai, ho jayega”", c: "#F0B429", ink: "#8A5A00" },
  { text: "“Sona nahi aa raha, teen din se”", c: "#4356CE", ink: "#2C3A9B" },
  { text: "“Sabko lagta hai main theek hoon”", c: "#E14D7C", ink: "#A82454" },
  { text: "“Ghar pe bataunga toh tension le lenge”", c: "#0E9FA6", ink: "#076166" },
  { text: "“I don't know why I'm crying”", c: "#7C4D9B", ink: "#5B3475" },
  { text: "“Result aane wala hai”", c: "#E36A3B", ink: "#9A3410" },
  { text: "“Log kya kahenge”", c: "#E14D7C", ink: "#A82454" },
  { text: "“Kisi se baat karne ka mann nahi”", c: "#4356CE", ink: "#2C3A9B" },
];

export default function PhraseTicker() {
  return (
    <section
      className="group relative overflow-hidden border-y border-forest-800/10 bg-ivory-dark/70 py-6"
      aria-label="Things people tell us"
    >
      <div className="mesh-warm pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />

      {/* fade the edges so phrases arrive and leave, rather than clip */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ivory-dark to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ivory-dark to-transparent"
        aria-hidden="true"
      />

      <div className="relative flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            className="flex shrink-0 items-center gap-4 pr-4"
            aria-hidden={copy === 1 ? "true" : undefined}
          >
            {phrases.map((phrase) => (
              <li key={phrase.text} className="whitespace-nowrap">
                <span
                  className="inline-flex items-center gap-3 rounded-full border px-5 py-2 font-display text-lg italic md:text-xl"
                  style={{
                    color: phrase.ink,
                    borderColor: `${phrase.c}59`,
                    background: `${phrase.c}1A`,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: phrase.c }}
                    aria-hidden="true"
                  />
                  {phrase.text}
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
