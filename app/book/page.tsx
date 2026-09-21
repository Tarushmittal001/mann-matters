import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { listExperts } from "@/lib/experts-store";
import { proBonoStatus } from "@/lib/features/booking/server";
import BookingFlow from "@/components/booking/BookingFlow";

export const metadata: Metadata = {
  title: "Book a session",
  description:
    "Book a confidential online session with a licensed psychologist in under five minutes. Choose your concern, expert, and time — from ₹599.",
};

// the session decides which of two screens this page is, so it can't be static
export const dynamic = "force-dynamic";

export default async function BookPage({
  searchParams,
}: {
  searchParams: { expert?: string; free?: string };
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
  return (
    <BookingFlow
      authenticated={!!session}
      experts={experts}
      initialExpert={initialExpert}
      freeIntent={freeIntent}
      proBono={proBono}
    />
  );
}
