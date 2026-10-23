import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Fill, type LegalSection } from "@/components/legal/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of use",
  alternates: { canonical: "/terms" },
  description:
    "The terms for using Emoraa: who can use it, what therapy here can and can't do, bookings and payments, and our responsibilities to each other.",
};

/* DRAFT — needs review by a lawyer before launch. Replace every <Fill>. */

const sections: LegalSection[] = [
  {
    id: "agreement",
    heading: "About these terms",
    body: (
      <p>
        These terms are an agreement between you and <Fill>registered legal entity name</Fill>{" "}
        (&ldquo;Emoraa&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account or booking a session
        you agree to them, and to our <Link href="/privacy">privacy policy</Link> and{" "}
        <Link href="/refund-policy">refund &amp; cancellation policy</Link>. If you don&apos;t agree, please
        don&apos;t use the service.
      </p>
    ),
  },
  {
    id: "not-emergency",
    heading: "Emoraa is not an emergency service",
    body: (
      <>
        <p>
          <strong>
            If you are in crisis, thinking about harming yourself, or someone is in danger, do not wait for a
            session.
          </strong>{" "}
          Call Tele-MANAS on <a href="tel:14416">14416</a> (free, 24x7) or emergency services on{" "}
          <a href="tel:112">112</a>, or go to the nearest hospital. More helplines are on our{" "}
          <Link href="/crisis">crisis page</Link>.
        </p>
        <p>
          Our sessions are scheduled appointments. We cannot monitor messages around the clock or respond to
          emergencies.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    heading: "Who can use Emoraa",
    body: (
      <ul>
        <li>You must be 18 or older, or have consent from a parent or lawful guardian, collected during booking.</li>
        <li>The information you give us, including your age, must be true and kept up to date.</li>
        <li>
          You are responsible for keeping your password and sign-in codes private, and for activity on your
          account.
        </li>
      </ul>
    ),
  },
  {
    id: "the-service",
    heading: "What the service is and isn't",
    body: (
      <>
        <p>
          Emoraa connects you with qualified mental-health practitioners for online counselling, therapy and psychiatric consultation.
          Practitioners on Emoraa are <Fill>employees of / independent professionals contracted by</Fill> Emoraa
          and are responsible for their own clinical judgement.
        </p>
        <ul>
          <li>
            Therapy helps many people, but we cannot promise any particular result or recovery.
          </li>
          <li>
            Counsellors and psychologists on Emoraa do not prescribe medication unless a practitioner is
            explicitly listed as a psychiatrist.
          </li>
          <li>
            Our free tools (self-checks, the burnout check, the BMI calculator, mood check-ins, and similar) are
            for reflection and general information only. They are not a diagnosis.
          </li>
          <li>
            <strong>Manu</strong>, our AI assistant, is software, not a therapist. It can make mistakes and
            must not be relied on for medical, clinical, or crisis advice.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "bookings",
    heading: "Bookings, payments and cancellations",
    body: (
      <>
        <p>
          Prices are shown in Indian Rupees and include applicable taxes unless stated otherwise. A session is
          confirmed once payment succeeds. Rescheduling, cancellations, no-shows, and refunds are governed by
          our <Link href="/refund-policy">refund &amp; cancellation policy</Link>.
        </p>
        <p>
          Coupons and referral credits have their own conditions shown when you use them. They cannot be
          exchanged for cash, and we may withdraw one that is being misused.
        </p>
      </>
    ),
  },
  {
    id: "conduct",
    heading: "Your conduct",
    body: (
      <>
        <p>Please treat practitioners and our team with respect. You agree not to:</p>
        <ul>
          <li>record a session without everyone&apos;s explicit permission;</li>
          <li>harass, threaten, or abuse a practitioner or staff member;</li>
          <li>use someone else&apos;s account or payment details, or give false information;</li>
          <li>try to break, overload, scrape, or get around the security of the service;</li>
          <li>use the service for anything unlawful.</li>
        </ul>
        <p>
          We may suspend or close an account that breaks these terms. Where it is safe to do so, we will tell
          you why first.
        </p>
      </>
    ),
  },
  {
    id: "confidentiality",
    heading: "Confidentiality",
    body: (
      <p>
        What you say in a session stays between you and your practitioner. There are narrow exceptions: a
        serious and imminent risk to your life or someone else&apos;s, a child at risk of harm, or a legal
        obligation such as a court order. How we handle your data is explained in our{" "}
        <Link href="/privacy">privacy policy</Link>.
      </p>
    ),
  },
  {
    id: "content",
    heading: "Our content",
    body: (
      <p>
        The Emoraa name, logo, website, articles, and tools belong to us or our licensors. You may use them for
        your own personal, non-commercial purposes. Please don&apos;t copy, resell, or republish them without
        permission.
      </p>
    ),
  },
  {
    id: "liability",
    heading: "Limits of our liability",
    body: (
      <>
        <p>
          We work hard to keep Emoraa available and accurate, but we provide it &ldquo;as is&rdquo;. To the
          extent Indian law allows, we are not liable for indirect or consequential losses. Our total liability
          for any claim relating to a session is limited to the amount you paid for that session.
        </p>
        <p>
          Nothing in these terms limits liability that cannot be limited by law, or your rights under the
          Consumer Protection Act, 2019.
        </p>
      </>
    ),
  },
  {
    id: "law",
    heading: "Governing law and disputes",
    body: (
      <p>
        These terms are governed by the laws of India. If something goes wrong, please contact us first at{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>. We will try to resolve it within 30 days. Any dispute
        we cannot resolve together falls under the jurisdiction of the courts at <Fill>city, e.g. Noida</Fill>,
        without affecting your right to approach a consumer commission.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to these terms",
    body: (
      <p>
        We may update these terms as the service changes. For material changes, we will tell signed-in users
        before they take effect. Continuing to use Emoraa after that means you accept the updated terms.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="the fine print, kept plain"
      title="Terms of use"
      updated="2026-10-06"
      current="/terms"
      intro={
        <p>
          These are the ground rules for using Emoraa. We&apos;ve written them to be read, not skimmed past.
        </p>
      }
      sections={sections}
    />
  );
}
