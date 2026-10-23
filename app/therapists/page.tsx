import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import Directory from "@/components/practitioners/Directory";
import ScriptConstellation from "@/components/visuals/ScriptConstellation";
import { filtersFor, listPractitioners } from "@/lib/practitioners";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our care team",
  description:
    "The certified psychologists and psychiatrists behind Emoraa — their qualifications, the languages they work in, what they specialise in, and what a session costs.",
  alternates: { canonical: "/therapists" },
};

/**
 * Who we are, before anybody has to book anything.
 *
 * `force-dynamic` because this reads the live catalogue: an admin who hides a
 * listing, changes a price or uploads a new portrait should see it here on the
 * next load, not after a rebuild. refreshExpertPages() revalidates this path
 * too, so a cached variant can never outlive the edit that changed it.
 */
export const dynamic = "force-dynamic";

export default async function TherapistsPage() {
  const people = await listPractitioners();
  const { languages, concerns } = filtersFor(people);

  /* Counted, never typed: the day an eleventh psychologist is added in admin,
     this sentence is already right. */
  const prescribing = people.filter((p) => p.prescribes).length;
  const talking = people.length - prescribing;
  const langCount = languages.length;

  /* Published so a search engine can show the practice and its people as one
     organisation rather than eleven unrelated pages. Only what is already on
     the screen — no ratings, because a rating in structured data becomes a
     star in a search result, and ranking therapists is not something this
     site does. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    name: site.name,
    url: `${site.url}/therapists`,
    employee: people.map((p) => ({
      "@type": "Person",
      name: p.name,
      jobTitle: p.discipline,
      url: `${site.url}/therapists/${p.slug}`,
      knowsLanguage: p.languages,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="page-top relative overflow-hidden pb-10">
        {/* The team, drawn as the languages they speak — one star per
            practitioner, in the hue their card wears below. Masked into the
            page from the right, the same way the other hero canvases on this
            site sit behind their headlines. */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] md:block"
          aria-hidden="true"
        >
          <div
            className="pointer-events-auto h-full w-full opacity-[0.92]"
            style={{
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 30%, black 100%)",
              maskImage: "linear-gradient(to right, transparent 0%, black 30%, black 100%)",
            }}
          >
            <ScriptConstellation people={people.map((p) => ({ hue: p.accentH, languages: p.languages }))} />
          </div>
        </div>

        {/* pointer-events-none so the canvas behind still hears the pointer;
            the one link takes it back (the hero placement contract) */}
        <div className="wrap-wide pointer-events-none relative z-10">
        <Reveal>
          <p className="eyebrow mb-4 flex items-center gap-3">
            <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">
              मन
            </span>
            the people, not the platform
          </p>

          {/* "Therapists" was the heading and it quietly excluded the one
              psychiatrist; "Doctors" would have mislabelled the ten who are
              not. "Care team" is the only honest word that holds both, and the
              line underneath names each profession rather than leaving the
              reader to guess which is which. */}
          <h1 className="h-display max-w-3xl text-[clamp(2.5rem,6vw,4.5rem)]">
            Our care team.
            <br />
            <span className="italic text-forest-600">Psychologists and psychiatrists.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">
            Every one of them is qualified and checked by us, and every one works in more than one Indian language.
            Read about them here and choose for yourself, or{" "}
            <Link href="/match" className="link-draw pointer-events-auto font-medium text-forest-800">
              let us suggest someone
            </Link>{" "}
            if that feels like less work today.
          </p>

          {/* The difference decides who can help with medication, so it is
              stated here rather than left to a credential line people may not
              know how to read. */}
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-5">
            <div className="max-w-[17rem]">
              <p className="flex items-center gap-2 font-display text-lg font-medium text-forest-900">
                <span className="inline-block h-2 w-2 rounded-full bg-[#2E8C8C]" aria-hidden="true" />
                {talking} psychologists
              </p>
              <p className="mt-1.5 text-[0.88rem] leading-relaxed text-ink/70">
                They work through talking, and are registered to do it.
              </p>
            </div>
            <div className="max-w-[17rem]">
              <p className="flex items-center gap-2 font-display text-lg font-medium text-forest-900">
                <span className="inline-block h-2 w-2 rounded-full bg-[#5FA98A]" aria-hidden="true" />
                {prescribing} {prescribing === 1 ? "psychiatrist" : "psychiatrists"}
              </p>
              <p className="mt-1.5 text-[0.88rem] leading-relaxed text-ink/70">
                A medical doctor, so they can also prescribe and review medication.
              </p>
            </div>
            <div className="max-w-[15rem]">
              <p className="flex items-center gap-2 font-display text-lg font-medium text-forest-900">
                <span className="inline-block h-2 w-2 rounded-full bg-gold" aria-hidden="true" />
                {langCount} languages
              </p>
              <p className="mt-1.5 text-[0.88rem] leading-relaxed text-ink/70">
                Between them, across the whole team.
              </p>
            </div>
          </div>
        </Reveal>
        </div>
      </section>

      <section className="wrap-wide pb-24">
        {people.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-forest-800/20 p-12 text-center">
            <p className="font-display text-xl text-forest-900">Nobody is listed right now.</p>
            <p className="mx-auto mt-3 max-w-md text-[0.95rem] text-ink/70">
              Our practitioner list is being updated. Please check back shortly, or write to us at{" "}
              {site.email}.
            </p>
          </div>
        ) : (
          <Directory people={people} languages={languages} concerns={concerns} />
        )}
      </section>
    </>
  );
}
