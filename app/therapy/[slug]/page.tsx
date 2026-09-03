import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Accordion from "@/components/ui/Accordion";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { experts } from "@/lib/experts";
import { site } from "@/lib/site";
import { getTherapyPage, therapyPages } from "@/lib/therapy-pages";
import { formatINR } from "@/lib/utils";

export function generateStaticParams() {
  return therapyPages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = getTherapyPage(params.slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/therapy/${page.slug}` },
    openGraph: { title: page.title, description: page.description, images: [page.image] },
  };
}

export default function TherapyLanding({ params }: { params: { slug: string } }) {
  const page = getTherapyPage(params.slug);
  if (!page) notFound();
  const matchingExperts = page.language
    ? experts.filter((expert) => expert.languages.includes(page.language as string))
    : experts.slice(0, 3);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.title,
    description: page.description,
    provider: { "@type": "Organization", name: site.name, url: site.url },
    areaServed:
      page.kind === "city"
        ? { "@type": "City", name: page.name }
        : { "@type": "Country", name: "India" },
    availableLanguage: page.language ? [page.language, "English"] : undefined,
    serviceType: "Online mental health counselling",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="page-top pb-16 md:pb-24">
        <div className="wrap-wide grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <Reveal>
            <p className="eyebrow mb-5">{page.eyebrow}</p>
            <h1 className="h-display text-4xl md:text-6xl">{page.title}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">{page.introduction}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/book" variant="gold">Find a psychologist</Button>
              <Button href="/match" variant="outline">Help me choose</Button>
            </div>
          </Reveal>
          <Reveal from="right">
            <Image src={page.image} alt={page.imageAlt} width={1200} height={900} priority className="aspect-[4/3] w-full rounded-3xl object-cover shadow-bloom" />
          </Reveal>
        </div>
      </section>

      <section className="section bg-sage-light/25">
        <div className="wrap-wide grid gap-8 md:grid-cols-3">
          {page.realities.map((item, index) => <Reveal key={item.title} delay={index * 0.08}><div className="border-t border-forest-800/15 pt-5"><h2 className="font-display text-2xl font-medium text-forest-900">{item.title}</h2><p className="mt-3 leading-relaxed text-ink/65">{item.body}</p></div></Reveal>)}
        </div>
      </section>

      <section className="section">
        <div className="wrap-wide">
          <Reveal><p className="eyebrow">people you can meet</p><h2 className="h-display mt-4 text-3xl md:text-5xl">Choose for fit, not just a filter.</h2></Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {matchingExperts.map((expert) => <Reveal key={expert.id}><article className="rounded-2xl border border-forest-800/10 bg-ivory-light p-5 shadow-lift"><Image src={expert.photo} alt={`Portrait of ${expert.name}`} width={600} height={600} className="aspect-square w-full rounded-xl object-cover" /><h3 className="mt-5 font-display text-xl font-medium text-forest-900">{expert.name}</h3><p className="mt-1 text-sm text-ink/55">{expert.credentials}</p><p className="mt-3 text-sm leading-relaxed text-ink/65">{expert.languages.join(" · ")}</p><p className="mt-4 font-semibold text-forest-800">From {formatINR(expert.price)}</p></article></Reveal>)}
          </div>
        </div>
      </section>

      <section className="section bg-ivory-light">
        <div className="wrap max-w-3xl"><Reveal><p className="eyebrow">common questions</p><h2 className="h-display mt-4 text-3xl md:text-4xl">What people ask first</h2><div className="mt-8"><Accordion items={page.faqs} /></div><p className="mt-8 text-sm text-ink/55">Looking for another format? <Link href="/services" className="font-medium text-forest-800 underline underline-offset-4">Explore all services</Link>.</p></Reveal></div>
      </section>
    </>
  );
}