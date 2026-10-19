import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listExperts } from "@/lib/experts-store";
import { proBonoStatus } from "@/lib/features/booking/server";
import { serviceBySlug } from "@/lib/service-catalogue";
import { MINOR_AGE } from "@/lib/intake";
import BookingFlow from "@/components/booking/BookingFlow";

export const metadata: Metadata = {
  title: "सेशन बुक करें",
  description:
    "योग्य भारतीय मनोवैज्ञानिक के साथ निजी ऑनलाइन सेशन, पाँच मिनट में बुक कीजिए। ₹599 से।",
  alternates: {
    canonical: "/hi/book",
    languages: { "en-IN": "/book", "hi-IN": "/hi/book" },
  },
};

export const dynamic = "force-dynamic";

/**
 * The booking flow, in Hindi.
 *
 * Exactly the same component and exactly the same server checks as /book —
 * `BookingFlow` reads the language off the URL. Duplicating the flow for a
 * second language would be two booking systems to keep in step, and the one
 * that fell behind would be the Hindi one.
 */
export default async function HindiBookPage({
  searchParams,
}: {
  searchParams: { expert?: string; free?: string; ref?: string; service?: string };
}) {
  const session = await getSession();
  const experts = await listExperts();
  const initialExpert = experts.find((e) => e.id === searchParams?.expert) ?? null;
  const freeIntent = searchParams?.free === "1";
  const proBono = freeIntent && session ? (await proBonoStatus(session.sub)).state : null;
  const initialCode = typeof searchParams?.ref === "string" ? searchParams.ref.slice(0, 32) : "";
  // arrived from a service card, so the first step is already answered
  const initialService = serviceBySlug(searchParams?.service ?? "");

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
