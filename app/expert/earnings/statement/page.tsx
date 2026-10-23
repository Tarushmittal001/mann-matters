import type { Metadata } from "next";
import Link from "next/link";
import PrintButton from "@/components/booking/PrintButton";
import StatementCsv from "@/components/expert/StatementCsv";
import { requireExpertContext } from "@/lib/expert-data";
import { monthlyStatement } from "@/lib/expert-earnings";
import { monthLabel, recentMonths } from "@/lib/payouts";
import { BUSINESS } from "@/lib/receipts";
import { cn, formatDateISO, formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Statement | Expert",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * One month's work as a document — the thing a self-employed practitioner
 * hands an accountant or files for their own books.
 *
 * Printed from the browser rather than generated as a PDF, the same way
 * receipts work here: no PDF library in the bundle, and what is on screen is
 * exactly what comes out of the printer.
 */
export default async function StatementPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const ctx = await requireExpertContext("/expert/earnings/statement");
  const months = recentMonths(12);
  const month = months.includes(searchParams.month ?? "") ? searchParams.month! : months[0];
  const s = await monthlyStatement(ctx.profile.expertId, month);

  return (
    <section className="pb-24">
      <div className="print:hidden">
        <Link href="/expert/earnings" className="link-draw text-sm font-medium text-forest-700">
          ← Earnings
        </Link>
        <h1 className="h-display mt-3 text-3xl md:text-4xl">Monthly statement</h1>
        <p className="mt-3 max-w-2xl text-ink/65">
          Every session you held that month, and every late cancellation you are paid for, with
          what was collected and your share. Print it or take the CSV.
        </p>

        <nav aria-label="Month" className="mt-6 flex flex-wrap gap-2">
          {months.slice(0, 8).map((m) => (
            <Link
              key={m}
              href={`/expert/earnings/statement?month=${m}`}
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

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <PrintButton />
          <StatementCsv statement={s} who={ctx.profile.expertId} />
        </div>
      </div>

      <article className="mt-8 rounded-2xl border border-forest-800/15 bg-ivory-light p-6 shadow-lift sm:p-8 print:border-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-forest-800/15 pb-5">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.14em] text-ink/50">Statement for</p>
            <p className="font-display text-xl font-semibold text-forest-900">
              {ctx.listing?.name ?? ctx.session.name}
            </p>
            {ctx.listing?.credentials && (
              <p className="text-[0.84rem] text-ink/65">{ctx.listing.credentials}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[0.68rem] uppercase tracking-[0.14em] text-ink/50">Period</p>
            <p className="font-display text-xl font-semibold text-forest-900">{s.monthName}</p>
            <p className="text-[0.82rem] text-ink/65">
              Paid by {BUSINESS.legalName} · {Math.round(s.share * 100)}% share
            </p>
          </div>
        </header>

        {s.lines.length === 0 ? (
          <p className="py-12 text-center text-ink/65">No sessions held in {s.monthName}.</p>
        ) : (
          <>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[40rem] border-collapse text-[0.88rem]">
                <caption className="sr-only">
                  Sessions held and late cancellations paid in {s.monthName}, with your share of each
                </caption>
                <thead>
                  <tr className="border-b border-forest-800/15 text-left">
                    {["Date", "Client", "Session", "Collected", "Emoraa", "You"].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-3 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ink/60",
                          i > 2 && "text-right"
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.lines.map((l) => (
                    <tr key={l.ref} className="border-b border-forest-800/[0.06] last:border-0">
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {formatDateISO(l.date)}
                        <span className="ml-1.5 text-ink/55">{l.time}</span>
                      </td>
                      <td className="px-3 py-2.5 text-ink/80">{l.client}</td>
                      <td className="px-3 py-2.5 text-ink/70">
                        {l.service}
                        {l.free && <span className="ml-1.5 text-[0.8rem] text-ink/50">free</span>}
                        {l.lateCancel && (
                          <span className="ml-1.5 text-[0.8rem] text-ink/50">cancelled late</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink/75">
                        {formatINR(l.collected)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink/60">
                        {formatINR(l.platform)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-forest-900">
                        {formatINR(l.earned)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-forest-800/20 font-semibold">
                    <td className="px-3 py-3" colSpan={3}>
                      {s.totals.sessions} {s.totals.sessions === 1 ? "session" : "sessions"}
                      {(s.totals.free > 0 || s.totals.lateCancelled > 0) && (
                        <span className="ml-1.5 font-normal text-ink/60">
                          (
                          {[
                            s.totals.free > 0 && `${s.totals.free} free`,
                            s.totals.lateCancelled > 0 && `${s.totals.lateCancelled} cancelled late`,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                          )
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-ink/75">
                      {formatINR(s.totals.collected)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-ink/60">
                      {formatINR(s.totals.platform)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-forest-900">
                      {formatINR(s.totals.earned)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-6 border-t border-forest-800/15 pt-5">
              {s.paid ? (
                <p className="text-[0.9rem] text-forest-800">
                  <span className="font-semibold">{formatINR(s.paid.amount)} paid</span> on{" "}
                  {formatDateISO(s.paid.paidAt.slice(0, 10))}
                  {s.paid.reference && (
                    <span className="ml-2 font-mono text-[0.82rem] text-ink/55">
                      {s.paid.reference}
                    </span>
                  )}
                  {s.paid.amount !== s.totals.earned && (
                    <span className="ml-2 text-haldi-ink">
                      — differs from {formatINR(s.totals.earned)} earned, usually a refund after
                      payday
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-[0.9rem] text-ink/70">
                  Not yet paid out. This statement is what is owed, not what has been sent.
                </p>
              )}
            </div>
          </>
        )}

        <p className="mt-6 text-[0.74rem] leading-relaxed text-ink/55">
          Prepared by {BUSINESS.legalName} from its own records. No tax has been deducted or
          added; what you owe on this income is between you and your accountant.
        </p>
      </article>
    </section>
  );
}
