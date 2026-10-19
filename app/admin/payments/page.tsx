import type { Metadata } from "next";
import Link from "next/link";
import PayoutSheet from "@/components/admin/PayoutSheet";
import PeriodPicker from "@/components/admin/PeriodPicker";
import RefundButton from "@/components/admin/RefundButton";
import {
  PAYMENT_FILTERS,
  isPaymentFilter,
  listPayments,
  moneyLeftOnTheTable,
  type PaymentRow,
} from "@/lib/admin-payments";
import { BOOKING_LABEL, PAYMENT_LABEL, TONE_CLASS, describe } from "@/lib/admin-status";
import { rangeParams, resolveRange } from "@/lib/admin-period";
import { refundableAmount, todayIST } from "@/lib/features/booking/policy";
import { monthLabel, payoutsForMonth, recentMonths } from "@/lib/payouts";
import { cn, formatDateISO, formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Payments | Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * Who has paid us, and who we have paid.
 *
 * Two directions on one screen on purpose: they are the same question asked
 * twice, and keeping them apart is how a practice ends up confident about its
 * takings and vague about its obligations.
 */

function Chip({ label, tone }: { label: string; tone: keyof typeof TONE_CLASS }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[0.72rem] font-semibold",
        TONE_CLASS[tone]
      )}
    >
      {label}
    </span>
  );
}

function PaymentTable({ rows, caption }: { rows: PaymentRow[]; caption: string }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-forest-800/10 bg-ivory-light">
      <table className="w-full min-w-[62rem] border-collapse text-[0.9rem]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-forest-800/10 text-left">
            {["Session", "Client", "With", "Payment", "Session status", "Amount", ""].map((h, i) => (
              <th
                key={h || "actions"}
                className={cn(
                  "px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink/60",
                  i === 5 && "text-right"
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const pay = describe(PAYMENT_LABEL, r.status);
            const session = describe(BOOKING_LABEL, r.bookingStatus);
            return (
              <tr key={r.id} className="border-b border-forest-800/[0.06] last:border-0">
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="text-forest-900">{formatDateISO(r.date)}</span>
                  <span className="ml-2 text-ink/60">{r.time}</span>
                  <span className="mt-0.5 block font-mono text-[0.72rem] text-ink/45">
                    {r.ref}
                    {r.receiptNo && <span className="ml-2">{r.receiptNo}</span>}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/clients/${r.clientId}`}
                    className="link-draw font-medium text-forest-800"
                  >
                    {r.clientName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink/75">{r.expertName}</td>
                <td className="px-4 py-3">
                  <Chip label={pay.label} tone={pay.tone} />
                  {r.method && (
                    <span className="mt-1 block text-[0.74rem] uppercase text-ink/50">
                      {r.method}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Chip label={session.label} tone={session.tone} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-forest-900">
                  {formatINR(r.amount)}
                  {r.refundAmount ? (
                    <span className="mt-0.5 block text-[0.74rem] text-ink/60">
                      −{formatINR(r.refundAmount)} refunded
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-right">
                  {(() => {
                    const left = refundableAmount({
                      status: r.status,
                      amount: r.amount,
                      refundAmount: r.refundAmount,
                    });
                    return (
                      <RefundButton
                        bookingId={r.bookingId}
                        bookingRef={r.ref}
                        max={left.max}
                        alreadyBack={left.alreadyBack}
                        blocked={left.max > 0 ? null : left.reason}
                      />
                    );
                  })()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: { status?: string; month?: string; period?: string; from?: string; to?: string };
}) {
  const filter = isPaymentFilter(searchParams.status) ? searchParams.status : "all";
  const months = recentMonths(12);
  const month = months.includes(searchParams.month ?? "") ? searchParams.month! : months[0];
  const range = resolveRange(searchParams);

  const [incoming, unpaid, payouts] = await Promise.all([
    listPayments(filter, range),
    moneyLeftOnTheTable(),
    payoutsForMonth(month),
  ]);

  const owedOut = payouts.filter((p) => !p.settled).reduce((n, p) => n + p.due, 0);
  const sentOut = payouts.reduce((n, p) => n + (p.settled?.amount ?? 0), 0);

  return (
    <section className="wrap-wide pb-28">
      <p className="eyebrow">money in, money out</p>
      <h1 className="h-display mt-3 text-4xl md:text-5xl">Payments</h1>
      <p className="mt-4 max-w-2xl text-ink/65">
        What clients have paid us, and what we have paid practitioners. A payout is only
        &ldquo;paid&rdquo; once somebody records it here — the rest of this page is arithmetic,
        that part is a fact only you know.
      </p>

      <div className="mt-10 grid gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        {[
          { label: `Collected, ${range.inline}`, value: formatINR(incoming.collected), tone: "" },
          {
            label: "Awaited from clients",
            value: formatINR(incoming.awaited),
            tone: incoming.awaited > 0 ? "text-gold-dark" : "",
          },
          {
            label: `Owed out, ${monthLabel(month)}`,
            value: formatINR(owedOut),
            tone: owedOut > 0 ? "text-gold-dark" : "",
          },
          { label: `Sent out, ${monthLabel(month)}`, value: formatINR(sentOut), tone: "" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-forest-800/10 bg-ivory-light p-5 shadow-lift"
          >
            <p className={cn("font-display text-2xl font-medium text-forest-900", s.tone)}>
              {s.value}
            </p>
            <p className="mt-1 text-sm text-ink/70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── money left on the table ─────────────────────────────────────── */}
      {unpaid.rows.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-medium text-forest-900">
            Sessions that were never paid for
          </h2>
          <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-ink/70">
            {unpaid.rows.length} {unpaid.rows.length === 1 ? "session has" : "sessions have"}{" "}
            already happened with the payment still awaited or failed —{" "}
            <span className="font-semibold text-gold-dark">{formatINR(unpaid.total)}</span> in all.
            A practitioner gave that time.
          </p>
          <div className="mt-5">
            <PaymentTable
              rows={unpaid.rows}
              caption="Sessions in the past whose payment never completed"
            />
          </div>
        </section>
      )}

      {/* ── from clients ────────────────────────────────────────────────── */}
      <section className="mt-14">
        <h2 className="font-display text-2xl font-medium text-forest-900">From clients</h2>
        <p className="mt-2 text-[0.9rem] text-ink/70">
          Sessions dated {range.inline}.
        </p>

        <PeriodPicker
          range={range}
          today={todayIST()}
          extra={{ status: filter, month }}
          className="mt-4"
        />

        <nav aria-label="Filter by payment status" className="mt-4 flex flex-wrap gap-2">
          {PAYMENT_FILTERS.map((f) => {
            const n = f.value === "all" ? undefined : incoming.counts[f.value] ?? 0;
            return (
              <Link
                key={f.value}
                href={`/admin/payments?${new URLSearchParams({ ...rangeParams(range), status: f.value, month }).toString()}`}
                aria-current={f.value === filter ? "page" : undefined}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  f.value === filter
                    ? "border-forest-800 bg-forest-800 text-ivory"
                    : "border-forest-800/15 text-forest-800 hover:border-forest-800"
                )}
              >
                {f.label}
                {n !== undefined && (
                  <span className={cn("ml-2", f.value === filter ? "text-ivory/70" : "text-ink/45")}>
                    {n}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {incoming.rows.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-forest-800/20 bg-ivory-light/60 p-12 text-center text-ink/70">
            No payments with that status.
          </p>
        ) : (
          <>
            <div className="mt-6">
              <PaymentTable rows={incoming.rows} caption="Payments from clients, newest first" />
            </div>
            {incoming.truncated && (
              <p className="mt-3 text-[0.84rem] text-ink/60">
                Showing the 200 most recent. Narrow it with a status above.
              </p>
            )}
          </>
        )}
      </section>

      {/* ── to practitioners ────────────────────────────────────────────── */}
      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-medium text-forest-900">
              To practitioners — {monthLabel(month)}
            </h2>
            <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-ink/70">
              Earned in the month the session was held, whenever the card cleared. A refunded
              session pays nobody.
            </p>
          </div>
        </div>

        <nav aria-label="Payout month" className="mt-5 flex flex-wrap gap-2">
          {months.slice(0, 6).map((m) => (
            <Link
              key={m}
              href={`/admin/payments?${new URLSearchParams({ ...rangeParams(range), status: filter, month: m }).toString()}`}
              aria-current={m === month ? "page" : undefined}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                m === month
                  ? "border-forest-800 bg-forest-800 text-ivory"
                  : "border-forest-800/15 text-forest-800 hover:border-forest-800"
              )}
            >
              {monthLabel(m)}
            </Link>
          ))}
        </nav>

        {payouts.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-forest-800/20 bg-ivory-light/60 p-12 text-center text-ink/70">
            No sessions were held in {monthLabel(month)}.
          </p>
        ) : (
          <PayoutSheet month={month} monthName={monthLabel(month)} payouts={payouts} />
        )}
      </section>
    </section>
  );
}
