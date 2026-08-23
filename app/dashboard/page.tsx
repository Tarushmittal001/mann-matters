import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { concerns, experts } from "@/lib/experts";
import { cn, formatDateISO, formatINR, todayISO } from "@/lib/utils";
import Button from "@/components/ui/Button";
import LogoutButton from "@/components/auth/LogoutButton";
import CancelBookingButton from "@/components/booking/CancelBookingButton";

export const metadata: Metadata = {
  title: "My sessions",
  description: "Your upcoming and past therapy sessions at mann Matters.",
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
              cancelled ? "bg-red-50 text-red-700" : "bg-sage-light/70 text-forest-800"
            )}
          >
            {cancelled ? "Cancelled" : "Confirmed"}
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

  const bookings = await prisma.booking.findMany({
    where: { userId: session.sub },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const today = todayISO();
  const upcoming = bookings.filter((b) => b.status === "CONFIRMED" && b.date > today);
  const past = bookings
    .filter((b) => b.status !== "CONFIRMED" || b.date <= today)
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
            Everything you've booked, in one quiet place. Rescheduling is free up to 24 hours
            before a session.
          </p>
        </div>
        <div className="flex items-center gap-6">
          {session.role === "ADMIN" && (
            <Link href="/admin" className="link-draw text-sm font-medium text-forest-800">
              Admin portal
            </Link>
          )}
          <LogoutButton />
          <Button href="/book" variant="gold">
            Book a session
          </Button>
        </div>
      </div>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-medium text-forest-900">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-forest-800/20 bg-ivory-light/60 p-10 text-center">
            <p className="text-ink/65">Nothing on the calendar yet.</p>
            <p className="mt-1 text-sm text-ink/50">
              Fifty minutes for yourself is closer than you think.
            </p>
            <div className="mt-6">
              <Button href="/book" variant="forest">
                Find your fifty minutes
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {upcoming.map((b) => (
              <BookingCard key={b.id} booking={b} upcoming />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-medium text-forest-900">Past & cancelled</h2>
          <div className="mt-5 space-y-4">
            {past.map((b) => (
              <BookingCard key={b.id} booking={b} upcoming={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
