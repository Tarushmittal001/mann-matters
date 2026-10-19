import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MINOR_AGE } from "@/lib/intake";
import { listExperts } from "@/lib/experts-store";
import { proBonoStatus } from "@/lib/features/booking/server";
import { serviceBySlug } from "@/lib/service-catalogue";
import BookingFlow from "@/components/booking/BookingFlow";

export const metadata: Metadata = {
  title: "Book a session",
  alternates: {
    canonical: "/book",
    languages: { "en-IN": "/book", "hi-IN": "/hi/book" },
  },
  description:
    "Book a confidential online session with a certified psychologist in under five minutes. Choose your concern, expert, and time — from ₹999, or ₹599 for students.",
};

// the session decides which of two screens this page is, so it can't be static
export const dynamic = "force-dynamic";

export default async function BookPage({
  searchParams,
}: {
  searchParams: { expert?: string; free?: string; ref?: string; service?: string };
}) {
  // resolved on the server: no client round-trip, and no flash of a skeleton
  // before we know whether to show the flow or the sign-in gate
  const session = await getSession();
  // an unknown id is ignored rather than erroring — a stale link should still
  // open the booking flow, just without anyone pre-chosen
  const experts = await listExperts();
  const initialExpert = experts.find((e) => e.id === searchParams?.expert) ?? null;
  // ?free=1 comes from the "Consult now" bar. Whether the person may actually
  // have the free session is decided here, on the server, from their account —
  // the flow only ever shows what this says.
  const freeIntent = searchParams?.free === "1";
  const proBono = freeIntent && session ? (await proBonoStatus(session.sub)).state : null;
  // ?ref= comes off a shared referral link. It is only ever a suggestion for
  // the code box — whether it is worth anything is decided on the server.
  const initialCode = typeof searchParams?.ref === "string" ? searchParams.ref.slice(0, 32) : "";
  // arrived from a service card, so the first step is already answered
  const initialService = serviceBySlug(searchParams?.service ?? "");

  // A client under 18 needs a parent or guardian named and agreeing before the
  // first session is booked. Age comes from their own account, and the answer
  // is only ever asked for once — having given it, they never see it again.
  const account = session
    ? await prisma.user.findUnique({
        where: { id: session.sub },
        select: {
          age: true,
          intake: { select: { guardianName: true, guardianPhone: true, guardianConsent: true } },
        },
      })
    : null;
  const minor = typeof account?.age === "number" && account.age < MINOR_AGE;
  const guardianOnFile =
    !!account?.intake?.guardianConsent &&
    !!account.intake.guardianName.trim() &&
    !!account.intake.guardianPhone.trim();

  return (
    <BookingFlow
      authenticated={!!session}
      experts={experts}
      initialExpert={initialExpert}
      initialService={initialService}
      freeIntent={freeIntent}
      proBono={proBono}
      initialCode={initialCode}
      minor={minor}
      guardianOnFile={guardianOnFile}
    />
  );
}
