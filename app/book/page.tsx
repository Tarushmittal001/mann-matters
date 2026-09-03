import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import BookingFlow from "@/components/booking/BookingFlow";

export const metadata: Metadata = {
  title: "Book a session",
  description:
    "Book a confidential online session with a licensed psychologist in under five minutes. Choose your concern, expert, and time — from ₹599.",
};

// the session decides which of two screens this page is, so it can't be static
export const dynamic = "force-dynamic";

export default async function BookPage() {
  // resolved on the server: no client round-trip, and no flash of a skeleton
  // before we know whether to show the flow or the sign-in gate
  const session = await getSession();
  return <BookingFlow authenticated={!!session} />;
}
