import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { concerns } from "@/lib/experts";
import { cn, formatDateISO, formatINR, todayISO } from "@/lib/utils";
import LogoutButton from "@/components/auth/LogoutButton";

export const metadata: Metadata = {
  title: "Admin portal",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type AdminBooking = {
  id: string;
  ref: string;
  expertName: string;
  concern: string;
  date: string;
  time: string;
  amount: number;
  status: string;
  createdAt: Date;
};

type AdminClient = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  bookings: AdminBooking[];
};

export default async function AdminPage({ searchParams }: { searchParams: { q?: string } }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const q = searchParams.q?.trim() ?? "";
  const today = todayISO();

  const [clients, totalClients, totalBookings, upcomingCount, revenue] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "USER",
        ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}),
      },
      include: { bookings: { orderBy: [{ date: "desc" }, { time: "desc" }] } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "CONFIRMED", date: { gt: today } } }),
    prisma.booking.aggregate({ _sum: { amount: true }, where: { status: "CONFIRMED" } }),
  ]);

  const stats = [
    { label: "Clients", value: String(totalClients) },
    { label: "Total bookings", value: String(totalBookings) },
    { label: "Upcoming sessions", value: String(upcomingCount) },
    { label: "Booked value", value: formatINR(revenue._sum.amount ?? 0) },
  ];

  return (
    <div className="page-top wrap-wide pb-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-4 flex items-center gap-3">
            <span
              className="font-deva text-sm normal-case tracking-normal text-gold"
              aria-hidden="true"
            >
              मन
            </span>
            admin portal
          </p>
          <h1 className="h-display text-4xl md:text-5xl">Bookings overview</h1>
          <p className="mt-4 max-w-xl text-ink/65">
            Every client and every session, grouped by the person who booked it.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="link-draw text-sm font-medium text-forest-800">
            My dashboard
          </Link>
          <LogoutButton />
        </div>
      </div>

      {/* stats */}
      <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-forest-800/10 bg-ivory-light p-6 shadow-lift"
          >
            <p className="font-display text-3xl font-medium text-forest-900">{s.value}</p>
            <p className="mt-1 text-sm text-ink/60">{s.label}</p>
          </div>
        ))}
      </div>

      {/* search */}
      <form method="GET" className="mt-12 flex max-w-md gap-3" role="search">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search clients by name or email…"
          aria-label="Search clients by name or email"
          className="w-full rounded-full border border-forest-800/15 bg-ivory-light px-5 py-2.5 text-[0.92rem] text-forest-900 placeholder:text-ink/35 focus:border-forest-800 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-forest-800 px-6 py-2.5 text-[0.9rem] font-semibold text-ivory transition-colors hover:bg-forest-700"
        >
          Search
        </button>
        {q && (
          <Link
            href="/admin"
            className="self-center whitespace-nowrap text-sm font-medium text-ink/55 hover:text-forest-900"
          >
            Clear
          </Link>
        )}
      </form>

      {/* clients */}
      {clients.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-forest-800/20 bg-ivory-light/60 p-12 text-center text-ink/60">
          {q ? <>No clients match “{q}”.</> : <>No clients have signed up yet.</>}
        </div>
      ) : (
        <div className="mt-10 space-y-8">
          {clients.map((user: AdminClient) => (
            <section
              key={user.id}
              className="overflow-hidden rounded-2xl border border-forest-800/10 bg-ivory-light shadow-lift"
            >
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-forest-800/10 px-6 py-5">
                <div>
                  <h2 className="font-display text-xl font-medium text-forest-900">{user.name}</h2>
                  <p className="text-sm text-ink/60">
                    {user.email} · joined{" "}
                    {formatDateISO(user.createdAt.toISOString().slice(0, 10))}
                  </p>
                </div>
                <span className="rounded-full bg-sage-light/70 px-3 py-1 text-[0.75rem] font-semibold text-forest-800">
                  {user.bookings.length} booking{user.bookings.length === 1 ? "" : "s"}
                </span>
              </header>

              {user.bookings.length === 0 ? (
                <p className="px-6 py-5 text-sm text-ink/55">No bookings yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead>
                      <tr className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink/50">
                        <th className="px-6 py-3">Ref</th>
                        <th className="px-4 py-3">Expert</th>
                        <th className="px-4 py-3">Concern</th>
                        <th className="px-4 py-3">Session</th>
                        <th className="px-4 py-3">Fee</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-6 py-3">Booked on</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.bookings.map((b: AdminBooking) => (
                        <tr key={b.id} className="border-t border-forest-800/[0.07]">
                          <td className="px-6 py-3.5 font-mono font-semibold text-forest-800">
                            {b.ref}
                          </td>
                          <td className="px-4 py-3.5 text-forest-900">{b.expertName}</td>
                          <td className="px-4 py-3.5 text-ink/70">
                            {concerns.find((c) => c.id === b.concern)?.label ?? b.concern}
                          </td>
                          <td className="px-4 py-3.5 text-ink/70">
                            {formatDateISO(b.date)} · {b.time}
                          </td>
                          <td className="px-4 py-3.5 text-ink/70">{formatINR(b.amount)}</td>
                          <td className="px-4 py-3.5">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em]",
                                b.status === "CANCELLED"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-sage-light/70 text-forest-800"
                              )}
                            >
                              {b.status === "CANCELLED" ? "Cancelled" : "Confirmed"}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-ink/55">
                            {formatDateISO(b.createdAt.toISOString().slice(0, 10))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
