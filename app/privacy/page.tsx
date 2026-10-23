import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Fill, type LegalSection } from "@/components/legal/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  alternates: { canonical: "/privacy" },
  description:
    "What personal data Emoraa collects, why, who it is shared with, how long it is kept, and your rights under India's Digital Personal Data Protection Act, 2023.",
};

/*
 * DRAFT — needs review by a lawyer before launch. Every <Fill> marks a fact
 * only the business can supply. The processors listed below match the code as
 * of the date on the page; update this page whenever a new one is added.
 */

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    heading: "Who we are",
    body: (
      <>
        <p>
          Emoraa (&ldquo;Emoraa&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is operated by{" "}
          <Fill>registered legal entity name</Fill>, a company registered in India with its office at{" "}
          <Fill>registered office address</Fill>. For the purposes of the Digital Personal Data Protection
          Act, 2023 (&ldquo;DPDP Act&rdquo;), we are the <strong>Data Fiduciary</strong> for the personal data
          described in this policy.
        </p>
        <p>
          This policy covers {site.url.replace("https://", "")}, our web app, and our WhatsApp and phone
          support. It does not cover what happens on a third-party video platform your therapist may use for a
          session (see section 5).
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    heading: "What we collect",
    body: (
      <>
        <p>We collect only what we need to run your sessions and keep the service safe:</p>
        <ul>
          <li>
            <strong>Account details</strong>: name, email address, phone number, date of birth, gender (optional),
            preferred language, organisation (if you joined through one), and a hashed password. We never
            store your password in readable form.
          </li>
          <li>
            <strong>Booking and payment records</strong>: the service, therapist, date and time you chose,
            coupon or referral codes used, the amount paid, and the payment status. We keep only the card brand
            and last four digits, or a masked UPI ID. We never store full card numbers or CVVs.
          </li>
          <li>
            <strong>Health information you choose to share</strong>: answers on the pre-session intake form,
            self-check results, and anything you type into notes. This is sensitive, and we treat it that way
            (see section 4).
          </li>
          <li>
            <strong>Your therapist&apos;s session notes</strong>: clinical notes your therapist writes after a
            session. These are visible only to your therapist and, where legally required, to authorised
            clinical staff.
          </li>
          <li>
            <strong>Messages</strong>: what you send through the contact form, feedback form, WhatsApp, or our
            assistant, Manu.
          </li>
          <li>
            <strong>Technical data</strong>: a session cookie that keeps you signed in, and basic device and
            error information. If you accept analytics cookies, we also collect anonymous page-view statistics
            (see our <Link href="/cookies">cookie policy</Link>).
          </li>
        </ul>
        <p>
          We do <strong>not</strong> record your therapy sessions, and we do not see or listen to what is said
          in them.
        </p>
      </>
    ),
  },
  {
    id: "why",
    heading: "Why we use it",
    body: (
      <>
        <p>We process your personal data on the basis of your consent, for these purposes only:</p>
        <ul>
          <li>creating and securing your account, including verifying your email and phone;</li>
          <li>matching you with a therapist and arranging, reminding you of, and running your sessions;</li>
          <li>taking payments, issuing receipts, and handling refunds;</li>
          <li>giving your therapist the context you chose to share before you meet;</li>
          <li>replying to messages and support requests;</li>
          <li>preventing fraud and abuse and keeping the service secure;</li>
          <li>meeting our legal obligations, for example tax records and lawful requests from authorities.</li>
        </ul>
        <p>
          We do not sell your data. We do not use your health information for advertising, and we do not share
          it with your employer, college, or school, even if they referred you or pay for your sessions.
        </p>
      </>
    ),
  },
  {
    id: "health-data",
    heading: "Sensitive and health information",
    body: (
      <>
        <p>
          Mental-health information is among the most personal data there is. We ask for your explicit consent
          before you share it. Access is limited to you and your therapist, and every access to a client
          record by our staff is logged.
        </p>
        <p>
          <strong>Safety exception.</strong> If what you share suggests a serious and imminent risk to your
          life or someone else&apos;s, your therapist may need to act to keep people safe, for example by
          contacting emergency services or an emergency contact. This is the professional standard of care
          and is permitted under the DPDP Act for medical emergencies.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    heading: "Who we share it with",
    body: (
      <>
        <p>
          We share personal data only with service providers (&ldquo;Data Processors&rdquo;) that help us run
          Emoraa, under contracts that limit them to processing it on our instructions:
        </p>
        <ul>
          <li>
            <strong>Your therapist</strong>: your booking details and anything you share for your sessions.
          </li>
          <li>
            <strong>Hosting and database</strong>: <Fill>hosting provider and server region</Fill>.
          </li>
          <li>
            <strong>Email delivery</strong>: Resend (verification links, receipts, reminders).
          </li>
          <li>
            <strong>SMS delivery</strong>: Twilio (one-time sign-in codes).
          </li>
          <li>
            <strong>Payments</strong>: <Fill>payment gateway, e.g. Razorpay</Fill>, which processes your card
            or UPI details under its own PCI-DSS obligations.
          </li>
          <li>
            <strong>AI assistant</strong>: Anthropic processes messages you send to Manu so it can reply.
            Don&apos;t share anything with Manu that you wouldn&apos;t want processed this way.
          </li>
          <li>
            <strong>Error monitoring</strong>: Sentry receives technical error reports, with form contents and
            cookies removed.
          </li>
          <li>
            <strong>Analytics</strong>: PostHog receives anonymous page views, only if you accept analytics
            cookies. Private pages (your dashboard, bookings, sign-in, and crisis pages) are never tracked.
          </li>
          <li>
            <strong>Video sessions</strong>: your therapist may share a link to Google Meet, Jitsi, or Daily.
            When you join, that platform&apos;s own privacy policy applies.
          </li>
        </ul>
        <p>
          We may also disclose data where Indian law requires it, for example to comply with a court order.
        </p>
      </>
    ),
  },
  {
    id: "transfers",
    heading: "Where your data is stored",
    body: (
      <p>
        Our primary database is hosted in <Fill>country / region of the database</Fill>. Some of the
        providers listed above, including Resend, Twilio, Anthropic, Sentry, and PostHog, may process data
        outside India. Any such transfer is made only to countries not restricted by the Government of India
        under section 16 of the DPDP Act, and with safeguards in our contracts.
      </p>
    ),
  },
  {
    id: "retention",
    heading: "How long we keep it",
    body: (
      <ul>
        <li>
          <strong>Account and intake data</strong>: for as long as your account is open, then deleted within{" "}
          <Fill>e.g. 90 days</Fill> of you closing it or asking us to delete it.
        </li>
        <li>
          <strong>Therapist session notes</strong>: <Fill>retention period required by professional
          guidelines, e.g. 3 years after the last session</Fill>, then deleted.
        </li>
        <li>
          <strong>Payment and invoice records</strong>: 8 years, as required by Indian tax law. These records
          hold no health information.
        </li>
        <li>
          <strong>Security logs</strong>: up to <Fill>e.g. 1 year</Fill>.
        </li>
      </ul>
    ),
  },
  {
    id: "your-rights",
    heading: "Your rights",
    body: (
      <>
        <p>Under the DPDP Act, you can:</p>
        <ul>
          <li>ask what personal data we hold about you and how we use it;</li>
          <li>have inaccurate or incomplete data corrected or updated;</li>
          <li>have your data erased, except what we must keep by law;</li>
          <li>withdraw your consent at any time. This won&apos;t affect anything we did before you withdrew it, but we may no longer be able to provide sessions;</li>
          <li>nominate someone to exercise these rights for you if you die or become incapacitated;</li>
          <li>raise a grievance with us, and then with the Data Protection Board of India if you are not satisfied.</li>
        </ul>
        <p>
          You can correct most details yourself in your{" "}
          <Link href="/dashboard/profile">profile</Link>. For anything else, email{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a> or our Grievance Officer (below). We reply within 30
          days.
        </p>
      </>
    ),
  },
  {
    id: "children",
    heading: "Children and young people",
    body: (
      <p>
        Under the DPDP Act, anyone under 18 is a child. If you are under 18, we need verifiable consent from a
        parent or lawful guardian before you can book a session, and we collect it during booking. We do not
        track children&apos;s behaviour or show them targeted advertising.
      </p>
    ),
  },
  {
    id: "security",
    heading: "How we protect it",
    body: (
      <p>
        We encrypt data in transit (HTTPS everywhere), hash passwords, limit staff access by role and log it,
        rate-limit sign-in attempts, and keep card details off our servers. No system is perfectly secure. If a
        breach affects your personal data, we will tell you and the Data Protection Board as the DPDP Act
        requires.
      </p>
    ),
  },
  {
    id: "grievance",
    heading: "Grievance Officer",
    body: (
      <>
        <p>For any question or complaint about your personal data, contact our Grievance Officer:</p>
        <p>
          <strong>
            <Fill>Full name</Fill>
          </strong>
          <br />
          Grievance Officer, <Fill>registered legal entity name</Fill>
          <br />
          Email: <Fill>grievance@emoraa.com</Fill>
          <br />
          Address: <Fill>registered office address</Fill>
        </p>
        <p>
          We acknowledge grievances within 48 hours and aim to resolve them within 30 days. If you are not
          satisfied with our response, you may complain to the Data Protection Board of India.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    heading: "Changes to this policy",
    body: (
      <p>
        If we make a material change, we will update the date at the top of this page and tell signed-in users
        by email or in the app before it takes effect. Where a change needs your fresh consent, we will ask for
        it.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="your data"
      title="Privacy policy"
      updated="2026-10-06"
      current="/privacy"
      intro={
        <p>
          Asking for help takes trust. This page explains, in plain language, what we collect, why, who sees it,
          and how you stay in control of it.
        </p>
      }
      sections={sections}
    />
  );
}
