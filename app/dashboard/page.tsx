import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sessionPhase } from "@/lib/expert-portal";
import { releaseExpiredHolds, serializeBooking } from "@/lib/features/booking/server";
import {
  BOOKING_STATUS,
  SESSION_MINUTES,
  changePolicyNote,
} from "@/lib/features/booking/policy";
import Button from "@/components/ui/Button";
import LogoutButton from "@/components/auth/LogoutButton";
import BookingCard from "@/components/booking/BookingCard";
import { CrisisLine, EmptyState } from "@/components/ui/Feedback";

export const metadata: Metadata = {
  title: "My sessions",
  description: "Your upcoming and past therapy sessions at Emoraa.",
  // a page listing someone's therapy sessions has no business in an index
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");

  const now = new Date();
  const serverNow = now.toISOString();
  await releaseExpiredHolds();
  const bookings = (await prisma.booking.findMany({
    where: { userId: session.sub },
    include: { payment: true },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  })).map((booking) => serializeBooking(booking, now));

  const awaitingPayment = bookings.filter(
    (booking) => booking.status === BOOKING_STATUS.pendingPayment
  ).length;

  /**
   * Ahead of you is a question about the clock, not the calendar: a session at
   * 6pm today is still ahead of you at 5pm, and its join link lives on its own
   * card. Splitting on the date alone filed today's session under "Past", which
   * is the last place anyone would look for a room that opens in ten minutes.
   */
  const ahead = (booking: (typeof bookings)[number]) =>
    (booking.status === BOOKING_STATUS.confirmed ||
      booking.status === BOOKING_STATUS.pendingPayment) &&
    sessionPhase(booking, SESSION_MINUTES, now) !== "past";

  const upcoming = bookings.filter(ahead);
  const past = bookings
    .filter((booking) => !ahead(booking))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="page-top wrap pb-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-4 flex items-center gap-3">
            <span
              className="font-deva text-sm normal-case tracking-normal text-gold"
              aria-hidden="true"
            >
              मन
            </span>
            my sessions
          </p>
          <h1 className="h-display text-4xl md:text-5xl">Hi, {session.name.split(" ")[0]}.</h1>
          <p className="mt-4 max-w-xl text-ink/65">
            Everything you&apos;ve booked, in one quiet place. {changePolicyNote}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          {session.role === "ADMIN" && (
            <Link href="/admin" className="link-draw text-sm font-medium text-forest-800">
              Admin portal
            </Link>
          )}
          {(session.role === "EXPERT" || session.role === "ADMIN") && (
            <Link href="/expert" className="link-draw text-sm font-medium text-forest-800">
              Expert portal
            </Link>
          )}
          <LogoutButton />
          <Button href="/book" variant="gold">
            Book a session
          </Button>
        </div>
      </div>

      {awaitingPayment > 0 && (
        <p className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3 text-[0.9rem] text-forest-900">
          {awaitingPayment === 1
            ? "One session is still waiting on payment — it isn't confirmed until that's done."
            : `${awaitingPayment} sessions are still waiting on payment — they aren't confirmed until that's done.`}
        </p>
      )}

      <section className="mt-14">
        <h2 className="font-display text-2xl font-medium text-forest-900">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="Nothing on the calendar yet."
              body="Fifty minutes for yourself is closer than you think — most people find a slot within 48 hours."
              action={
                <Button href="/book" variant="forest">
                  Find your fifty minutes
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {upcoming.map((b) => (
              <BookingCard key={b.id} booking={b} upcoming serverNow={serverNow} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-medium text-forest-900">Past & cancelled</h2>
          <div className="mt-5 space-y-4">
            {past.map((b) => (
              <BookingCard key={b.id} booking={b} upcoming={false} serverNow={serverNow} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-16 border-t border-forest-800/10 pt-8">
        <CrisisLine />
        <p className="mt-3 max-w-2xl text-[0.8rem] leading-relaxed text-ink/45">
          Sessions are confidential. What you discuss stays between you and your therapist — we
          never see session content, and we never sell or share your data.
        </p>
      </div>
    </div>
  );
}
