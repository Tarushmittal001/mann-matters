import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";

/* A bento of five photographs, each under a duotone wash from the palette,
   so the strip reads as one composition instead of five stock pictures.
   `span` is the desktop footprint; everything collapses to two columns on
   phones. */
const tiles = [
  {
    deva: "शहर",
    line: "The city you grew up in",
    img: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80",
    alt: "Hawa Mahal in Jaipur under a bright sky, with horses and autos passing below",
    c: "#E14D7C",
    wash: "linear-gradient(150deg,#E14D7C,#F0B429)",
    span: "md:col-span-2 md:row-span-2 col-span-2",
  },
  {
    deva: "पढ़ाई",
    line: "The night before the result",
    img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    alt: "Students leaning over laptops together at a long table in a library",
    c: "#4356CE",
    wash: "linear-gradient(150deg,#4356CE,#7C4D9B)",
    span: "md:col-span-2 col-span-2",
  },
  {
    deva: "खुशी",
    line: "The good days, worth keeping",
    img: "https://images.unsplash.com/photo-1509909756405-be0199881695?auto=format&fit=crop&w=800&q=80",
    alt: "A bunch of pink and orange balloons with smiley faces against a blue sky",
    c: "#F0B429",
    wash: "linear-gradient(150deg,#F0B429,#E36A3B)",
    span: "md:col-span-1 col-span-1",
  },
  {
    deva: "साँस",
    line: "The trip you keep postponing",
    img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
    alt: "A curve of Goa coastline with palms behind turquoise water",
    c: "#0E9FA6",
    wash: "linear-gradient(150deg,#0E9FA6,#4356CE)",
    span: "md:col-span-1 col-span-1",
  },
  {
    deva: "अपना",
    line: "The version of you at every wedding",
    img: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1400&q=80",
    alt: "A woman in a pale embroidered sharara turning on a tree-lined path",
    c: "#7C4D9B",
    wash: "linear-gradient(150deg,#7C4D9B,#E14D7C)",
    span: "md:col-span-4 col-span-2",
  },
];

export default function MomentsMosaic() {
  return (
    <section className="section relative overflow-hidden bg-ivory">
      <div className="mesh-warm pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />

      <div className="wrap-wide relative">
        <SectionHeading
          align="center"
          deva="मन"
          eyebrow="the life this sits inside"
          title="The same country, a hundred different days"
          description="Therapy isn't a room you step out of your life into. It's for the exam week, the wedding season, the flight you never booked, and the ordinary good afternoon you'd like more of."
        />

        <div className="grid auto-rows-[150px] grid-cols-2 gap-3 md:auto-rows-[190px] md:grid-cols-4 md:gap-4">
          {tiles.map((tile, i) => (
            <Reveal
              key={tile.deva}
              from="scale"
              delay={i * 0.08}
              className={`${tile.span} h-full`}
            >
              <figure
                className="duotone duotone-scrim group relative h-full w-full overflow-hidden rounded-2xl shadow-lift"
                style={{ ["--wash" as string]: tile.wash }}
              >
                <Image
                  src={tile.img}
                  alt={tile.alt}
                  fill
                  className="object-cover transition-transform duration-[900ms] ease-silk group-hover:scale-[1.08]"
                  sizes="(max-width: 768px) 50vw, 30vw"
                />
                <figcaption className="absolute inset-x-0 bottom-0 z-[3] p-4 md:p-5">
                  <span
                    className="font-deva text-lg leading-none md:text-xl"
                    style={{ color: "#FCFAF6", textShadow: "0 1px 8px rgba(6,33,28,0.6)" }}
                  >
                    {tile.deva}
                  </span>
                  <p className="mt-1.5 text-[0.82rem] font-medium leading-snug text-white/95 md:text-[0.9rem]">
                    {tile.line}
                  </p>
                  <span
                    className="mt-2.5 block h-1 w-0 rounded-full transition-all duration-700 ease-silk group-hover:w-12"
                    style={{ background: tile.c }}
                    aria-hidden="true"
                  />
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
