import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PAYMENT_STATUS } from "@/lib/features/booking/policy";
import {
  DEFAULT_THERAPIST_SHARE,
  GRAINS,
  isGrain,
  moneyOverRange,
  suggestGrain,
  monthLabel,
  payoutsForMonth,
  recentMonths,
} from "@/lib/payouts";
import { rangeParams, resolveRange } from "@/lib/admin-period";
import { todayIST } from "@/lib/features/booking/policy";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/utils";
import PeriodPicker from "@/components/admin/PeriodPicker";
import RevenueCsv from "@/components/admin/RevenueCsv";

export const metadata: Metadata = {
  title: "Revenue & payouts | Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminRevenuePage({
  searchParams,
}: {
  searchParams: { month?: string; grain?: string; period?: string; from?: string; to?: string };
}) {
  const months = recentMonths(12);
  const month = months.includes(searchParams.month ?? "") ? searchParams.month! : months[0];
  const range = resolveRange(searchParams);
  /* The zoom follows the span unless the admin has picked one, so a fortnight
     does not arrive as two monthly bars. */
  const grain = isGrain(searchParams.grain) ? searchParams.grain : suggestGrain(range.days);

  const [rows, payouts, lifetime, refundedAll] = await Promise.all([
    moneyOverRange(range, grain),
    payoutsForMonth(month),
    prisma.payment.aggregate({
      _sum: { amount: true },
      _count: true,
      // gross: a refunded payment WAS collected, and the refund is subtracted
      // below. Counting only PAID here made this tile disagree with every row
      // of the table beneath it.
      where: { status: { in: [PAYMENT_STATUS.paid, PAYMENT_STATUS.refunded] } },
    }),
    prisma.payment.aggregate({
      // whatever the status says — a partial refund leaves the payment PAID
      _sum: { refundAmount: true },
      where: { refundAmount: { not: null } },
    }),
  ]);

  const current = rows[0];
  const previous = rows[1];
  // what is still outstanding — a payout already sent is not owed
  const owed = payouts.filter((p) => !p.settled).reduce((sum, p) => sum + p.due, 0);
  const kept = payouts.reduce((sum, p) => sum + p.platform, 0);

  const change =
    previous && previous.net > 0
      ? Math.round(((current.net - previous.net) / previous.net) * 100)
      : null;

  return (
    <section className="wrap-wide pb-28">
      <p className="eyebrow">the books</p>
      <h1 className="h-display mt-3 text-4xl md:text-5xl">Revenue &amp; payouts</h1>
      <p className="mt-4 max-w-2xl text-ink/70">
        Money is counted when it is collected. A payout is earned in the month the session
        happened, not the month it was paid for — so somebody who worked in March appears in
        March, whenever the card cleared.
      </p>

      {/* lifetime */}
      <div className="mt-10 grid gap-3 min-[360px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {[
          { label: "Collected, all time", value: formatINR(lifetime._sum.amount ?? 0) },
          { label: "Payments taken", value: String(lifetime._count) },
          { label: "Refunded, all time", value: formatINR(refundedAll._sum.refundAmount ?? 0) },
          {
            label: `Latest ${grain}, net`,
            value: formatINR(current.net),
            note:
              change === null
                ? undefined
                : `${change >= 0 ? "+" : ""}${change}% on ${previous.label}`,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-forest-800/10 bg-ivory-light p-5 shadow-lift sm:p-6"
          >
            <p className="font-display text-2xl font-medium text-forest-900">{s.value}</p>
            <p className="mt-1 text-sm text-ink/70">{s.label}</p>
            {s.note && <p className="mt-0.5 text-[0.8rem] text-ink/70">{s.note}</p>}
          </div>
        ))}
      </div>

      {/* month by month */}
      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-medium text-forest-900">Takings over time</h2>
          <RevenueCsv rows={rows} grain={grain} />
        </div>

        <PeriodPicker
          range={range}
          today={todayIST()}
          extra={{ grain, month }}
          className="mt-5"
        />

        <nav aria-label="Zoom" className="mt-4 flex flex-wrap gap-2">
          {GRAINS.map((g) => (
            <Link
              key={g.value}
              href={`/admin/revenue?${new URLSearchParams({ ...rangeParams(range), grain: g.value, month }).toString()}`}
              aria-current={g.value === grain ? "page" : undefined}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                g.value === grain
                  ? "border-forest-800 bg-forest-800 text-ivory"
                  : "border-forest-800/15 text-forest-800 hover:border-forest-800"
              )}
            >
              {g.label}
            </Link>
          ))}
        </nav>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-forest-800/10 bg-ivory-light">
          <table className="w-full min-w-[46rem] border-collapse text-[0.92rem]">
            <caption className="sr-only">Collected, discounted and refunded, by month</caption>
            <thead>
              <tr className="border-b border-forest-800/10 text-left">
                {["Period", "Sessions", "Collected", "Given away", "Refunded", "Net"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-ink/70 ${
                      i > 0 ? "text-right" : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.key}
                  className={cn(
                    "border-b border-forest-800/[0.06] last:border-0",
                    grain === "month" && r.key === month && "bg-sage-light/25",
                    r.sessions === 0 && "text-ink/70"
                  )}
                >
                  <th scope="row" className="whitespace-nowrap px-5 py-3 text-left font-medium">
                    {/* a month row doubles as the payout selector below; the
                        other grains have nothing to select, so they stay text */}
                    {grain === "month" ? (
                      <Link
                        href={`/admin/revenue?${new URLSearchParams({ ...rangeParams(range), grain: "month", month: r.key }).toString()}`}
                        className="link-draw text-forest-800"
                      >
                        {r.label}
                      </Link>
                    ) : (
                      <span className="text-forest-900">{r.label}</span>
                    )}
                  </th>
                  <td className="px-5 py-3 text-right tabular-nums text-ink/75">
                    {r.sessions}
                    {r.free > 0 && (
                      <span className="ml-1 text-[0.8rem] text-ink/70">({r.free} free)</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-forest-900">
                    {formatINR(r.collected)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-ink/70">
                    {r.discounts ? `−${formatINR(r.discounts)}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-ink/70">
                    {r.refunds ? `−${formatINR(r.refunds)}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums text-forest-900">
                    {formatINR(r.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* payouts */}
      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-medium text-forest-900">
              Payouts for {monthLabel(month)}
            </h2>
            <p className="mt-2 max-w-2xl text-[0.9rem] text-ink/70">
              A share of what stayed with us: a refunded session pays nobody. The standard share is{" "}
              {Math.round(DEFAULT_THERAPIST_SHARE * 100)}% to the practitioner — change it in{" "}
              <code className="rounded bg-forest-800/[0.06] px-1.5 py-0.5 font-mono text-[0.85em]">
                lib/payouts.ts
              </code>
              .
            </p>
          </div>
        </div>

        {payouts.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-forest-800/20 bg-ivory-light/60 p-10 text-center text-ink/70">
            No sessions were held in {monthLabel(month)}.
          </p>
        ) : (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-forest-800/10 bg-ivory-light p-5">
                <p className="text-[0.78rem] uppercase tracking-[0.14em] text-ink/70">
                  Still owed out
                </p>
                <p className="mt-1.5 font-display text-3xl font-medium text-forest-900">
                  {formatINR(owed)}
                </p>
              </div>
              <div className="rounded-2xl border border-forest-800/10 bg-ivory-light p-5">
                <p className="text-[0.78rem] uppercase tracking-[0.14em] text-ink/70">
                  Emoraa keeps
                </p>
                <p className="mt-1.5 font-display text-3xl font-medium text-forest-900">
                  {formatINR(kept)}
                </p>
              </div>
              <div className="rounded-2xl border border-forest-800/10 bg-ivory-light p-5">
                <p className="text-[0.78rem] uppercase tracking-[0.14em] text-ink/70">
                  Payouts sent
                </p>
                <p className="mt-1.5 font-display text-3xl font-medium text-forest-900">
                  {payouts.filter((p) => p.settled).length}
                  <span className="text-xl text-ink/70"> of {payouts.length}</span>
                </p>
              </div>
            </div>

            <Link
              href={`/admin/payments?month=${month}`}
              className="press mt-6 inline-block rounded-full border border-forest-800/25 px-6 py-2.5 text-[0.9rem] font-semibold text-forest-800 transition-colors hover:border-forest-800"
            >
              Pay practitioners for {monthLabel(month)} →
            </Link>
          </>
        )}
      </section>

      <p className="mt-12 max-w-2xl text-[0.8rem] leading-relaxed text-ink/70">
        Free first sessions are counted in the session totals but pay nothing, because nothing was
        collected for them. If you decide to pay for pro bono work, that is a separate transfer —
        this page will not invent it.
      </p>
    </section>
  );
}
