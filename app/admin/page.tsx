import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { concerns } from "@/lib/experts";
import { releaseExpiredHolds } from "@/lib/features/booking/server";
import { BOOKING_STATUS, PAYMENT_STATUS, todayIST } from "@/lib/features/booking/policy";
import { cn, formatDateISO, formatINR } from "@/lib/utils";
import LogoutButton from "@/components/auth/LogoutButton";

export const metadata: Metadata = {
  title: "Admin portal",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const statusChip: Record<string, { label: string; cls: string }> = {
  [BOOKING_STATUS.confirmed]: { label: "Confirmed", cls: "bg-sage-light/70 text-forest-800" },
  [BOOKING_STATUS.pendingPayment]: { label: "Unpaid", cls: "bg-gold/20 text-gold-dark" },
  [BOOKING_STATUS.cancelled]: { label: "Cancelled", cls: "bg-red-50 text-red-700" },
  [BOOKING_STATUS.expired]: { label: "Expired", cls: "bg-forest-800/8 text-ink/55" },
};

function paymentLabel(p: { status: string; refundAmount: number | null } | null) {
  if (!p) return "—";
  if (p.status === PAYMENT_STATUS.paid) return "Paid";
  if (p.status === PAYMENT_STATUS.refunded)
    return `Refunded ${formatINR(p.refundAmount ?? 0)}`;
  if (p.status === PAYMENT_STATUS.failed) return "Failed";
  return "Pending";
}

export default async function AdminPage({ searchParams }: { searchParams: { q?: string } }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "ADMIN") redirect("/dashboard");

  await releaseExpiredHolds();

  const q = searchParams.q?.trim() ?? "";
  const today = todayIST();

  const [allClients, totalClients, totalBookings, upcomingCount, collected, refunded] =
    await Promise.all([
      prisma.user.findMany({
        where: { role: "USER" },
        include: {
          bookings: {
            include: { payment: true },
            orderBy: [{ date: "desc" }, { time: "desc" }],
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.booking.count(),
      prisma.booking.count({
        where: { status: BOOKING_STATUS.confirmed, date: { gt: today } },
      }),
      // money actually taken, not merely booked
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PAYMENT_STATUS.paid },
      }),
      prisma.payment.aggregate({
        _sum: { refundAmount: true },
        where: { status: PAYMENT_STATUS.refunded },
      }),
    ]);

  // SQLite's `contains` is case-sensitive, so the filter happens here instead —
  // fine at this scale, and it stops "Priya" from missing "priya@…"
  const needle = q.toLowerCase();
  const clients = needle
    ? allClients.filter(
        (u) =>
          u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle)
      )
    : allClients;

  const awaitingPayment = allClients.reduce(
    (n, u) =>
      n + u.bookings.filter((b) => b.status === BOOKING_STATUS.pendingPayment).length,
    0
  );

  const stats = [
    { label: "Clients", value: String(totalClients) },
    { label: "Total bookings", value: String(totalBookings) },
    { label: "Upcoming sessions", value: String(upcomingCount) },
    { label: "Awaiting payment", value: String(awaitingPayment) },
    { label: "Collected", value: formatINR(collected._sum.amount ?? 0) },
    { label: "Refunded", value: formatINR(refunded._sum.refundAmount ?? 0) },
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

      {/* this page shows why people sought therapy — that needs saying out loud */}
      <p className="mt-8 flex items-start gap-2.5 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3 text-[0.88rem] leading-relaxed text-forest-900">
        <svg viewBox="0 0 16 16" className="mt-[3px] h-4 w-4 shrink-0 fill-gold-dark" aria-hidden="true">
          <path d="M8 1 3 3.2v3.6c0 3.1 2.1 6 5 6.9 2.9-.9 5-3.8 5-6.9V3.2L8 1Zm0 4.2a1.3 1.3 0 0 1 .65 2.43V9.3a.65.65 0 0 1-1.3 0V7.63A1.3 1.3 0 0 1 8 5.2Z" />
        </svg>
        <span>
          <strong className="font-semibold">Confidential.</strong> This page carries clients&apos;
          names, contact details, and what they came to talk about. Don&apos;t screenshot it,
          don&apos;t leave it open on a shared screen, and don&apos;t export it.
        </span>
      </p>

      {/* stats */}
      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-forest-800/10 bg-ivory-light p-6 shadow-lift"
          >
            <p className="font-display text-2xl font-medium text-forest-900">{s.value}</p>
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
          {q ? <>No clients match &ldquo;{q}&rdquo;.</> : <>No clients have signed up yet.</>}
        </div>
      ) : (
        <div className="mt-10 space-y-8">
          {clients.map((user) => (
            <section
              key={user.id}
              className="overflow-hidden rounded-2xl border border-forest-800/10 bg-ivory-light shadow-lift"
            >
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-forest-800/10 px-6 py-5">
                <div>
                  <h2 className="font-display text-xl font-medium text-forest-900">{user.name}</h2>
                  <p className="text-sm text-ink/60">
                    {user.email}
                    {!user.emailVerified && (
                      <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-gold-dark">
                        unverified
                      </span>
                    )}{" "}
                    · joined {formatDateISO(user.createdAt.toISOString().slice(0, 10))}
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
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead>
                      <tr className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink/50">
                        <th className="px-6 py-3">Ref</th>
                        <th className="px-4 py-3">Expert</th>
                        <th className="px-4 py-3">Concern</th>
                        <th className="px-4 py-3">Session</th>
                        <th className="px-4 py-3">Fee</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Payment</th>
                        <th className="px-6 py-3">Booked on</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.bookings.map((b) => {
                        const chip = statusChip[b.status] ?? statusChip[BOOKING_STATUS.expired];
                        return (
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
                              {b.rescheduleCount > 0 && (
                                <span className="ml-1.5 text-[0.72rem] text-ink/45">
                                  (moved {b.rescheduleCount}×)
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-ink/70">{formatINR(b.amount)}</td>
                            <td className="px-4 py-3.5">
                              <span
                                className={cn(
                                  "rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em]",
                                  chip.cls
                                )}
                              >
                                {chip.label}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-ink/70">
                              {paymentLabel(b.payment)}
                              {b.payment?.method === "card" && b.payment.last4 && (
                                <span className="ml-1.5 text-[0.72rem] text-ink/45">
                                  •••• {b.payment.last4}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-3.5 text-ink/55">
                              {formatDateISO(b.createdAt.toISOString().slice(0, 10))}
                            </td>
                          </tr>
                        );
                      })}
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
