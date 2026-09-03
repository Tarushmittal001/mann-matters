import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Accordion from "@/components/ui/Accordion";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { serviceDetails } from "@/lib/service-details";
import { services } from "@/lib/services";
import { site } from "@/lib/site";
import { formatINR } from "@/lib/utils";

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const service = services.find((item) => item.slug === params.slug);
  if (!service) return {};
  return {
    title: `${service.title} online in India`,
    description: service.description,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: { title: service.title, description: service.description, images: [service.image] },
  };
}

export default function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = services.find((item) => item.slug === params.slug);
  const detail = serviceDetails[params.slug];
  if (!service || !detail) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description,
    provider: { "@type": "Organization", name: site.name, url: site.url },
    areaServed: { "@type": "Country", name: "India" },
    serviceType: "Online mental health counselling",
    offers: service.price
      ? { "@type": "Offer", priceCurrency: "INR", price: service.price }
      : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="page-top pb-16 md:pb-24">
        <div className="wrap-wide grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <Link href="/services" className="link-draw text-sm font-medium text-forest-700">
              All services
            </Link>
            <p className="eyebrow mb-4 mt-8">{service.tag}</p>
            <h1 className="h-display text-4xl md:text-6xl">{service.title}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">{detail.introduction}</p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Button href="/book" variant="gold">Book a session</Button>
              <span className="text-sm text-ink/55">
                {service.duration} · {service.price ? `${formatINR(service.price)} ${service.priceNote}` : service.priceNote}
              </span>
            </div>
          </Reveal>
          <Reveal from="right">
            <Image src={service.image} alt={service.imageAlt} width={1200} height={900} priority className="aspect-[4/3] w-full rounded-3xl object-cover shadow-bloom" />
          </Reveal>
        </div>
      </section>

      <section className="section bg-sage-light/25">
        <div className="wrap grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal><div><p className="eyebrow">who it can help</p><h2 className="h-display mt-4 text-3xl md:text-4xl">A place to begin, not a label.</h2></div></Reveal>
          <Reveal delay={0.1}>
            <ul className="space-y-4">
              {detail.forWhom.map((item) => <li key={item} className="flex gap-3 leading-relaxed text-ink/75"><span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{item}</li>)}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="wrap-wide">
          <Reveal><p className="eyebrow">what happens</p><h2 className="h-display mt-4 max-w-2xl text-3xl md:text-5xl">Care with a clear shape and room to be human.</h2></Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {detail.process.map((step, index) => <Reveal key={step.title} delay={index * 0.08}><div className="border-t border-forest-800/15 pt-5"><span className="font-display text-2xl text-gold-dark">0{index + 1}</span><h3 className="mt-4 font-display text-2xl font-medium text-forest-900">{step.title}</h3><p className="mt-3 leading-relaxed text-ink/65">{step.body}</p></div></Reveal>)}
          </div>
        </div>
      </section>

      <section className="section bg-ivory-light">
        <div className="wrap max-w-3xl"><Reveal><p className="eyebrow">common questions</p><h2 className="h-display mt-4 text-3xl md:text-4xl">Before you begin</h2><div className="mt-8"><Accordion items={detail.faqs} /></div></Reveal></div>
      </section>
    </>
  );
}