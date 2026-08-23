import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import Accordion from "@/components/ui/Accordion";
import ContactForm from "@/components/sections/ContactForm";
import FloatingOrbs from "@/components/ui/FloatingOrbs";
import { faqs } from "@/lib/faqs";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact — Talk to a human",
  description:
    "Questions about therapy, pricing, or how mann Matters works? Email, call, or WhatsApp us — a real person replies within one working day.",
};

export default function ContactPage() {
  return (
    <>
      <section className="page-top relative overflow-hidden pb-20">
        <FloatingOrbs />
        <div className="wrap-wide relative z-10 grid gap-16 lg:grid-cols-2 lg:gap-20">
          {/* invitation */}
          <Reveal>
            <p className="eyebrow mb-5 flex items-center gap-3">
              <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
              say hello
            </p>
            <h1 className="h-display text-5xl md:text-6xl">
              No question is
              <br />
              <em className="text-forest-600">too small.</em>
            </h1>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-ink/70">
              Wondering if therapy is &ldquo;for someone like you&rdquo;? Unsure which
              service fits? Want to check if we speak your language? Ask. A
              real person reads every message.
            </p>

            <dl className="mt-12 space-y-6">
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-ink/50">Email</dt>
                <dd className="mt-1">
                  <a href={`mailto:${site.email}`} className="link-draw font-display text-2xl font-medium text-forest-900">
                    {site.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-ink/50">Phone</dt>
                <dd className="mt-1">
                  <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="link-draw font-display text-2xl font-medium text-forest-900">
                    {site.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-ink/50">WhatsApp</dt>
                <dd className="mt-1">
                  <a
                    href={site.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-draw font-display text-2xl font-medium text-forest-900"
                  >
                    Chat with us →
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-ink/50">Where we are</dt>
                <dd className="mt-1 text-ink/70">{site.location}</dd>
              </div>
            </dl>

            <div className="mt-12 rounded-2xl border border-gold/40 bg-gold/10 p-6">
              <p className="text-[0.95rem] leading-relaxed text-forest-900">
                <span className="font-semibold">If you&apos;re in crisis,</span> please
                don&apos;t wait for an email reply. Call{" "}
                <a href="tel:14416" className="font-semibold underline decoration-gold underline-offset-4">
                  Tele-MANAS 14416
                </a>{" "}
                — free, confidential, 24x7, in 20+ Indian languages.
              </p>
            </div>
          </Reveal>

          {/* form */}
          <Reveal delay={0.15}>
            <ContactForm />
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-sage-light/30">
        <div className="wrap">
          <Reveal className="mb-12 max-w-2xl">
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
              before you ask
            </p>
            <h2 className="h-display text-4xl md:text-5xl">Questions, answered honestly</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <Accordion items={faqs} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
