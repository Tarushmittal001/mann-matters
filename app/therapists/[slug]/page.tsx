import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/ui/Reveal";
import { getPractitioner, listPractitioners } from "@/lib/practitioners";
import { site } from "@/lib/site";
import { formatINR } from "@/lib/utils";
import { registerLabel } from "@/lib/professions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getPractitioner(params.slug);
  if (!p) return { title: "Therapist not found" };
  return {
    title: `${p.name} — ${p.discipline}`,
    description:
      p.bio ||
      `${p.name}, ${p.discipline.toLowerCase()} at Emoraa. ${p.years} years practising, working in ${p.languages.join(", ")}.`,
    alternates: { canonical: `/therapists/${p.slug}` },
  };
}

/**
 * One practitioner, in full.
 *
 * The page a person reads when they have narrowed it to one or two and want to
 * know whether to trust them. So it leads with the things that answer that —
 * qualification, how long, which languages, what they work with — and puts the
 * booking action where it belongs: after the reading, not before it.
 *
 * Every session this person can take is listed with its own duration and its
 * own price, because "from ₹799" is where a price surprise starts.
 */
export default async function TherapistPage({ params }: { params: { slug: string } }) {
  const p = await getPractitioner(params.slug);
  if (!p) notFound();

  /* Same register as the directory card, so a face does not change colour
     between the grid and its own page. */
  const accent = (a = 1) => (a === 1 ? `hsl(${p.accentH} 38% 47%)` : `hsl(${p.accentH} 38% 47% / ${a})`);
  const others = (await listPractitioners()).filter((o) => o.slug !== p.slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    jobTitle: p.discipline,
    description: p.bio || undefined,
    knowsLanguage: p.languages,
    url: `${site.url}/therapists/${p.slug}`,
    worksFor: { "@type": "MedicalOrganization", name: site.name, url: site.url },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section
        className="page-top wrap-wide pb-20"
        style={{
          ["--accent" as string]: accent(),
          ["--accent-soft" as string]: accent(0.12),
          ["--ring" as string]: accent(0.36),
        }}
      >
        <Reveal>
          <Link href="/therapists" className="link-draw text-sm font-medium text-forest-700">
            ← Our care team
          </Link>

          <div className="mt-8 grid gap-8 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10">
            <div className="relative aspect-square w-full max-w-[13rem] overflow-hidden rounded-[1.6rem] bg-[color:var(--accent-soft)] ring-2 ring-[color:var(--ring)] ring-offset-4 ring-offset-ivory">
              {p.photo && (
                <Image
                  src={p.photo}
                  alt={`Portrait of ${p.name}`}
                  fill
                  sizes="(min-width: 768px) 13rem, 60vw"
                  className="object-cover"
                  priority
                />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h1 className="h-display text-4xl md:text-5xl">{p.name}</h1>
                {p.prescribes && (
                  <span className="rounded-full bg-gold/25 px-3 py-1 text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-gold-dark">
                    Can prescribe
                  </span>
                )}
              </div>

              <p className="mt-3 flex items-center gap-2 text-lg text-forest-800">
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full bg-[color:var(--accent)]"
                  aria-hidden="true"
                />
                {p.discipline}
              </p>
              <p className="mt-1.5 text-[0.95rem] text-ink/70">{p.credentials}</p>
              {/*
                The register, on the profile of the person who is on one.

                Emoraa does not require a council registration, so the site
                never says its psychologists as a group hold one — it says
                they are certified. Someone who IS registered shows it here,
                by name, with their number when they have given it.
              */}
              {(p.registrationBody || p.registrationNo) && (
                <p className="mt-1 text-[0.85rem] text-ink/70">
                  {p.registrationBody
                    ? registerLabel(p.registrationBody)
                    : `${p.prescribes ? "Medical council" : "Registration"} no.`}
                  {p.registrationNo && (
                    <>
                      {p.registrationBody ? " · " : " "}
                      <span className="font-medium tabular-nums text-forest-800">
                        {p.registrationNo}
                      </span>
                    </>
                  )}
                </p>
              )}

              <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-5 rounded-2xl bg-[color:var(--accent-soft)] px-5 py-4">
                <div>
                  <dt className="text-[0.75rem] uppercase tracking-[0.16em] text-ink/70">Practising</dt>
                  <dd className="mt-1 font-display text-xl font-medium text-forest-900">
                    {p.years} {p.years === 1 ? "year" : "years"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.75rem] uppercase tracking-[0.16em] text-ink/70">Languages</dt>
                  <dd className="mt-1 font-display text-xl font-medium text-forest-900">
                    {p.languages.join(" · ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.75rem] uppercase tracking-[0.16em] text-ink/70">Sessions from</dt>
                  <dd className="mt-1 font-display text-xl font-medium text-forest-900">
                    {p.priceRange ? formatINR(p.priceRange.min) : "On request"}
                  </dd>
                </div>
              </dl>

              {p.bio && (
                <p className="mt-7 max-w-2xl text-[1.02rem] leading-relaxed text-ink/75">{p.bio}</p>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-4">
                {p.bookable ? (
                  <Link
                    href={`/book?expert=${p.slug}`}
                    className="press rounded-full bg-gold px-7 py-3 text-[0.95rem] font-semibold text-forest-950 transition-colors hover:bg-gold-dark"
                  >
                    Book with {p.name.split(" ")[0]}
                  </Link>
                ) : (
                  <span className="rounded-full border border-forest-800/20 px-5 py-2.5 text-[0.9rem] text-ink/70">
                    Not taking bookings right now
                  </span>
                )}
                <Link href="/match" className="hit link-draw text-sm font-medium text-forest-800">
                  Not sure? Let us match you
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="wrap-wide pb-20">
        <Reveal>
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-medium text-forest-900">Works with</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {p.specialties.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-[color:var(--accent-soft)] px-3.5 py-1.5 text-[0.88rem] font-medium text-forest-800"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-medium text-forest-900">
                Sessions you can book
              </h2>
              {p.offers.length === 0 ? (
                <p className="mt-4 text-[0.95rem] text-ink/70">
                  No session types are set up for this listing yet.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-forest-800/10 border-y border-forest-800/10">
                  {p.offers.map((o) => (
                    <li key={o.slug} className="flex items-baseline justify-between gap-4 py-3">
                      <Link
                        href={`/services/${o.slug}`}
                        className="link-draw min-w-0 font-medium text-forest-800"
                      >
                        {o.title}
                      </Link>
                      <span className="shrink-0 text-right text-[0.9rem] text-ink/70">
                        {o.duration}
                        {typeof o.price === "number" && (
                          <>
                            {" · "}
                            <span className="font-semibold text-forest-900">{formatINR(o.price)}</span>
                          </>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Reveal>
      </section>

      {others.length > 0 && (
        <section className="wrap-wide pb-28">
          <Reveal>
            <h2 className="font-display text-2xl font-medium text-forest-900">Others you could see</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {others.map((o) => (
                <Link
                  key={o.slug}
                  href={`/therapists/${o.slug}`}
                  className="card-lift flex items-center gap-3.5 rounded-2xl border border-forest-800/10 bg-ivory-light p-4"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-sage-light/50">
                    {o.photo && (
                      <Image src={o.photo} alt="" fill sizes="56px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-medium text-forest-900">
                      {o.name}
                    </p>
                    <p className="truncate text-[0.82rem] text-ink/70">{o.discipline}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Reveal>
        </section>
      )}
    </>
  );
}
