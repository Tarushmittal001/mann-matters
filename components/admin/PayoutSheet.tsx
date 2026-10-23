"use client";

import MarkPayout from "@/components/admin/MarkPayout";
import { formatINR } from "@/lib/utils";
import type { ExpertPayout } from "@/lib/payouts";

/**
 * The month's payout table, with the one thing that makes it useful on the day
 * you actually pay people: a CSV you can hand to a bank or an accountant.
 *
 * The file is built from the same numbers on screen, in the browser, and never
 * leaves the machine. Nothing about a client is in it — only who worked, how
 * much came in, and what they are owed.
 *
 * The last column is the only part that is not arithmetic: whether the money
 * actually went. That is recorded by a person, through `MarkPayout`.
 */
export default function PayoutSheet({
  month,
  monthName,
  payouts,
}: {
  month: string;
  monthName: string;
  payouts: ExpertPayout[];
}) {
  const download = () => {
    const header = ["Practitioner", "Sessions", "Free", "Collected", "Share", "Due", "Emoraa", "Status", "Sent", "Reference"];
    const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const lines = [
      header.join(","),
      ...payouts.map((p) =>
        [
          escape(p.expertName),
          String(p.sessions),
          String(p.free),
          String(p.collected),
          `${Math.round(p.share * 100)}%`,
          String(p.due),
          String(p.platform),
          p.settled ? "Paid" : "Awaited",
          p.settled ? String(p.settled.amount) : "",
          escape(p.settled?.reference ?? ""),
        ].join(",")
      ),
      ["Total", "", "", String(payouts.reduce((s, p) => s + p.collected, 0)), "", String(payouts.reduce((s, p) => s + p.due, 0)), String(payouts.reduce((s, p) => s + p.platform, 0))].join(","),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emoraa-payouts-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6">
      <div className="overflow-x-auto rounded-2xl border border-forest-800/10 bg-ivory-light">
        <table className="w-full min-w-[52rem] border-collapse text-[0.92rem]">
          <caption className="sr-only">What each practitioner is owed for {monthName}</caption>
          <thead>
            <tr className="border-b border-forest-800/10 text-left">
              {["Practitioner", "Sessions", "Collected", "Share", "Due", "Emoraa keeps", "Payout"].map(
                (h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-ink/70 ${
                      i > 0 ? "text-right" : ""
                    }`}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.expertId} className="border-b border-forest-800/[0.06] last:border-0">
                <th scope="row" className="px-5 py-3 text-left font-medium text-forest-900">
                  {p.expertName}
                </th>
                <td className="px-5 py-3 text-right tabular-nums text-ink/75">
                  {p.sessions}
                  {p.free > 0 && (
                    <span className="ml-1 text-[0.8rem] text-ink/70">({p.free} free)</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-ink/75">
                  {formatINR(p.collected)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-ink/70">
                  {Math.round(p.share * 100)}%
                </td>
                <td className="px-5 py-3 text-right font-semibold tabular-nums text-forest-900">
                  {formatINR(p.due)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-ink/70">
                  {formatINR(p.platform)}
                </td>
                <td className="px-5 py-3">
                  <MarkPayout
                    expertId={p.expertId}
                    expertName={p.expertName}
                    month={month}
                    due={p.due}
                    settled={p.settled}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={download}
        className="press mt-5 rounded-full border border-forest-800/25 px-6 py-2.5 text-[0.9rem] font-semibold text-forest-800 transition-colors hover:border-forest-800"
      >
        Download {monthName} as CSV
      </button>
    </div>
  );
}
