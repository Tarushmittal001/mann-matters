import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { concerns, experts } from "@/lib/experts";
import { cn, formatDateISO, formatINR, todayISO } from "@/lib/utils";
import { STATUS_META, isSessionStatus } from "@/lib/expert-portal";
import { releaseExpiredHolds, serializeBooking } from "@/lib/bookings";
import { BOOKING_STATUS, changePolicyNote, hoursUntil } from "@/lib/booking-policy";
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

type BookingRow = {
  id: string;
  ref: string;
  concern: string;
  expertId: string;
  expertName: string;
  date: string;
  time: string;
  amount: number;
  status: string;
};

function BookingCard({ booking, upcoming }: { booking: BookingRow; upcoming: boolean }) {
  const expert = experts.find((e) => e.id === booking.expertId);
  const concern = concerns.find((c) => c.id === booking.concern);
  const cancelled = booking.status === "CANCELLED";
  const status = isSessionStatus(booking.status) ? booking.status : "CONFIRMED";

  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-2xl border bg-ivory-light p-6 shadow-lift sm:flex-row sm:items-center",
        cancelled ? "border-forest-800/10 opacity-70" : "border-forest-800/10"
      )}
    >
      {expert && (
        <Image
          src={expert.photo}
          alt={`Portrait of ${booking.expertName}`}
          width={150}
          height={150}
          className="h-16 w-16 shrink-0 rounded-xl object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="font-display text-lg font-medium text-forest-900">{booking.expertName}</p>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em]",
              STATUS_META[status].tone
            )}
          >
            {STATUS_META[status].label}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink/65">
          {formatDateISO(booking.date)} · {booking.time} IST · 50 min
          {concern && <> · {concern.label}</>}
        </p>
        <p className="mt-1 text-sm text-ink/55">
          Ref <span className="font-mono font-semibold text-forest-800">{booking.ref}</span> ·{" "}
          {formatINR(booking.amount)}
        </p>
      </div>
      {upcoming && !cancelled && (
        <div className="shrink-0">
          <CancelBookingButton bookingId={booking.id} />
        </div>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");

  const bookings: BookingRow[] = await prisma.booking.findMany({
    where: { userId: session.sub },
    include: { payment: true },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const today = todayISO();
  const upcoming = bookings.filter((b: BookingRow) => b.status === "CONFIRMED" && b.date > today);
  const past = bookings
    .filter((b: BookingRow) => b.status !== "CONFIRMED" || b.date <= today)
    .sort((a: BookingRow, b: BookingRow) => (a.date < b.date ? 1 : -1));

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
            {upcoming.map((b: BookingRow) => (
              <BookingCard key={b.id} booking={b} upcoming />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-medium text-forest-900">Past & cancelled</h2>
          <div className="mt-5 space-y-4">
            {past.map((b: BookingRow) => (
              <BookingCard key={b.id} booking={b} upcoming={false} />
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
