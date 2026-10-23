import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { listExperts } from "@/lib/experts-store";
import { getSession } from "@/lib/auth";
import { sessionPhase } from "@/lib/expert-portal";
import { releaseExpiredHolds, serializeBooking } from "@/lib/features/booking/server";
import { intakeState } from "@/lib/intake";
import { followUpsForClient, offersForClient, prescriptionsForClient } from "@/lib/follow-ups";
import { homeworkForClient } from "@/lib/homework";
import {
  BOOKING_STATUS,
  SESSION_MINUTES,
  changePolicyNote,
  todayIST,
} from "@/lib/features/booking/policy";
import Button from "@/components/ui/Button";
import LogoutButton from "@/components/auth/LogoutButton";
import BookingCard from "@/components/booking/BookingCard";
import RescheduleOfferCard from "@/components/booking/RescheduleOfferCard";
import FollowUpPrompt from "@/components/dashboard/FollowUpPrompt";
import HomeworkList from "@/components/dashboard/HomeworkList";
import { CrisisLine, EmptyState } from "@/components/ui/Feedback";
import { firstNameOf, formatDateISO } from "@/lib/utils";

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

  const experts = await listExperts();
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

  const intake = await intakeState(session.sub, todayIST());
  const homework = await homeworkForClient(session.sub);
  const followUps = await followUpsForClient(session.sub);
  const offers = await offersForClient(session.sub);
  const scripts = await prescriptionsForClient(session.sub);

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
          <h1 className="h-display text-4xl md:text-5xl">Hi, {firstNameOf(session.name)}.</h1>
          <p className="mt-4 max-w-xl text-ink/70">
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
          <Link href="/dashboard/referrals" className="link-draw text-sm font-medium text-forest-800">
            Invite a friend
          </Link>
          <Link href="/dashboard/feedback" className="link-draw text-sm font-medium text-forest-800">
            Share your story
          </Link>
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

      {/* the intake form earns its nudge only when there is a session to prepare for */}
      {intake.needsItBefore && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-forest-800/12 bg-sage-light/35 px-5 py-4">
          <p className="text-[0.92rem] leading-relaxed text-forest-900">
            <span className="font-semibold">Before you meet {intake.needsItBefore.expertName}.</span>{" "}
            Twelve minutes on the intake form buys most of your first session back.
          </p>
          <Link
            href="/dashboard/intake"
            className="press shrink-0 rounded-full bg-forest-800 px-5 py-2.5 text-[0.85rem] font-semibold text-ivory transition-colors hover:bg-forest-700"
          >
            Fill it in
          </Link>
        </div>
      )}

      <section className="mt-14">
        <h2 className="font-display text-2xl font-medium text-forest-900">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="Nothing on the calendar yet."
              body="Time that belongs to you is closer than you think — most people find a slot within 48 hours."
              action={
                <Button href="/book" variant="forest">
                  Find a time
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {upcoming.map((b) => (
              <BookingCard key={b.id} booking={b} upcoming serverNow={serverNow} experts={experts} />
            ))}
          </div>
        )}
      </section>

      {offers.length > 0 && (
        <div className="mb-10 space-y-3">
          {offers.map((o) => (
            <RescheduleOfferCard key={o.id} {...o} />
          ))}
        </div>
      )}

      {followUps.length > 0 && (
        <div className="mb-10">
          <FollowUpPrompt items={followUps} />
        </div>
      )}

      {scripts.length > 0 && (
        <section className="mb-10" aria-labelledby="rx-heading">
          <h2 id="rx-heading" className="font-display text-2xl font-medium text-forest-900">
            Your prescriptions
          </h2>
          <ul className="mt-4 divide-y divide-forest-800/8 rounded-2xl border border-forest-800/10 bg-ivory-light px-5">
            {scripts.map((rx) => (
              <li key={rx.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3.5">
                <span className="min-w-0">
                  <Link
                    href={`/prescription/${rx.id}`}
                    className="link-draw font-medium text-forest-800"
                  >
                    {rx.drugs.join(", ") || rx.number}
                  </Link>
                  <span className="ml-2 text-[0.84rem] text-ink/70">{rx.prescriberName}</span>
                </span>
                <span className="shrink-0 text-[0.84rem] text-ink/70">
                  {rx.cancelledAt ? (
                    <span className="font-semibold text-red-700">Withdrawn — do not use</span>
                  ) : (
                    formatDateISO(rx.issuedAt.slice(0, 10))
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <HomeworkList open={homework.open} done={homework.done} />

      {past.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-medium text-forest-900">Past & cancelled</h2>
          <div className="mt-5 space-y-4">
            {past.map((b) => (
              <BookingCard key={b.id} booking={b} upcoming={false} serverNow={serverNow} experts={experts} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-16 border-t border-forest-800/10 pt-8">
        <CrisisLine />
        <p className="mt-3 max-w-2xl text-[0.8rem] leading-relaxed text-ink/70">
          Sessions are confidential. What you discuss stays between you and your therapist — we
          never see session content, and we never sell or share your data.
        </p>
      </div>
    </div>
  );
}
