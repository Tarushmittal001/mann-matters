import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Fill, type LegalSection } from "@/components/legal/LegalPage";
import { FREE_CHANGE_HOURS, MAX_RESCHEDULES } from "@/lib/features/booking/policy";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund & cancellation policy",
  alternates: { canonical: "/refund-policy" },
  description: `Free to move or cancel up to ${FREE_CHANGE_HOURS} hours before your session. How rescheduling, cancellations, no-shows and refunds work at Emoraa.`,
};

/*
 * The hour limits are read from lib/features/booking/policy so this page can never
 * promise something different from what the booking system actually does.
 * DRAFT — needs review by a lawyer before launch. Replace every <Fill>.
 */

const sections: LegalSection[] = [
  {
    id: "summary",
    heading: "The short version",
    body: (
      <ul>
        <li>
          <strong>
            {FREE_CHANGE_HOURS}+ hours before your session
          </strong>
          : move it or cancel for a full refund.
        </li>
        <li>
          <strong>Less than {FREE_CHANGE_HOURS} hours before</strong>: the session can&apos;t be moved, and
          cancelling doesn&apos;t get a refund, because your therapist has already set that time aside for you.
        </li>
        <li>
          <strong>If we or your therapist cancel</strong>: you get a full refund or a free rebooking, whichever
          you choose.
        </li>
      </ul>
    ),
  },
  {
    id: "rescheduling",
    heading: "Rescheduling",
    body: (
      <p>
        You can move a session yourself from your <Link href="/dashboard">dashboard</Link> up to{" "}
        {FREE_CHANGE_HOURS} hours before it starts, at no cost. Each booking can be moved up to{" "}
        {MAX_RESCHEDULES} times. After that, please cancel and book again, or message us.
      </p>
    ),
  },
  {
    id: "cancelling",
    heading: "Cancelling",
    body: (
      <>
        <p>
          Cancel from your dashboard. If you cancel {FREE_CHANGE_HOURS} hours or more before the session, you
          get the full amount back. Inside the {FREE_CHANGE_HOURS}-hour window, the session fee is not refunded.
        </p>
        <p>
          A free first session cancelled {FREE_CHANGE_HOURS}+ hours ahead goes back to you to use later. Cancelled
          inside the window, it counts as used.
        </p>
      </>
    ),
  },
  {
    id: "no-shows",
    heading: "Missed sessions and technical problems",
    body: (
      <ul>
        <li>
          <strong>If you don&apos;t join</strong> within <Fill>e.g. 15 minutes</Fill> of the start time, the
          session counts as attended and isn&apos;t refunded.
        </li>
        <li>
          <strong>If your therapist doesn&apos;t join</strong>, or the session can&apos;t go ahead because of a
          problem on our side, you get a full refund or a free rebooking.
        </li>
        <li>
          <strong>If you have connection problems</strong>, tell us the same day. We will look at each case
          fairly.
        </li>
      </ul>
    ),
  },
  {
    id: "how-refunds-work",
    heading: "How refunds are paid",
    body: (
      <p>
        Refunds go back to the card, UPI account, or other method you paid with, usually within 5–7 working
        days of being approved, depending on your bank. If you paid partly with a coupon or referral credit,
        that part comes back as credit, not cash.
      </p>
    ),
  },
  {
    id: "packages",
    heading: "Packages and organisation-sponsored sessions",
    body: (
      <p>
        Unused sessions in a multi-session package are refundable on a pro-rata basis within{" "}
        <Fill>e.g. 90 days</Fill> of purchase. Sessions paid for by your employer, college, or school follow
        that organisation&apos;s agreement with us.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Questions or disputes",
    body: (
      <p>
        Something not right? Email <a href={`mailto:${site.email}`}>{site.email}</a> with your booking
        reference. We reply within 2 working days. This policy doesn&apos;t affect your rights under the
        Consumer Protection Act, 2019.
      </p>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPage
      eyebrow="bookings"
      title="Refund & cancellation policy"
      updated="2026-10-06"
      current="/refund-policy"
      intro={<p>Life happens. Here is exactly what happens to your money when plans change.</p>}
      sections={sections}
    />
  );
}
