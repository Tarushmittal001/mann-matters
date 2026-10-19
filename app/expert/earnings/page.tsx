import type { Metadata } from "next";
import Link from "next/link";
import PeriodPicker from "@/components/admin/PeriodPicker";
import { resolveRange, rangeParams } from "@/lib/admin-period";
import { requireExpertContext } from "@/lib/expert-data";
import { earningsBreakdown, gatherEarnings } from "@/lib/expert-earnings";
import { GRAINS, isGrain, suggestGrain } from "@/lib/payouts";
import { cn, formatDateISO, formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Earnings | Expert",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * What this practitioner has earned, and what has reached them.
 *
 * Their share, not the client's fee: showing gross would overstate what they
 * are owed every single time. Everything is scoped to their own expertId,
 * taken from the session rather than the URL.
 */

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "wait" | "good";
}) {
  return (
    <div className="rounded-2xl border border-forest-800/10 bg-ivory-light p-5 shadow-lift">
      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-ink/45">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-[1.9rem] font-medium leading-none",
          tone === "wait" ? "text-haldi-ink" : "text-forest-900"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-[0.82rem] leading-snug text-ink/60">{hint}</p>}
    </div>
  );
}

export default async function ExpertEarningsPage({
  searchParams,
}: {
  searchParams: { period?: string; from?: string; to?: string; grain?: string };
}) {
  const ctx = await requireExpertContext("/expert/earnings");
  const range = resolveRange(searchParams);
  const grain = isGrain(searchParams.grain) ? searchParams.grain : suggestGrain(range.days);
  const [e, split] = await Promise.all([
    gatherEarnings(ctx.profile.expertId, range, grain),
    earningsBreakdown(ctx.profile.expertId, range),
  ]);

  const busiest = Math.max(1, ...e.buckets.map((b) => b.earned));

  return (
    <section className="pb-24">
      <p className="eyebrow">what you have earned</p>
      <h1 className="h-display mt-3 text-4xl md:text-5xl">Earnings</h1>
      <p className="mt-4 max-w-2xl text-ink/65">
        Your share — {Math.round(e.share * 100)}% of what is collected and kept for sessions you
        held. A refunded session pays nobody, so it leaves these figures when the refund lands.
      </p>

      <PeriodPicker
        range={range}
        today={ctx.today}
        extra={{ grain }}
        className="mt-8"
      />

      <nav aria-label="Zoom" className="mt-4 flex flex-wrap gap-2">
        {GRAINS.map((g) => (
          <Link
            key={g.value}
            href={`/expert/earnings?${new URLSearchParams({ ...rangeParams(range), grain: g.value }).toString()}`}
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label={`Earned, ${range.inline}`}
          value={formatINR(e.period.earned)}
          hint={`${e.period.sessions} ${e.period.sessions === 1 ? "session" : "sessions"} · ${formatINR(e.period.collected)} collected`}
        />
        <Stat
          label="Received"
          value={formatINR(e.received)}
          hint="Payouts Emoraa has recorded as sent, all time"
        />
        <Stat
          label="Awaited"
          value={formatINR(e.awaited)}
          tone={e.awaited > 0 ? "wait" : undefined}
          hint={
            e.overpaid > 0
              ? `${formatINR(e.overpaid)} has been sent beyond what is earned — usually a refund after payday`
              : "Earned but not yet sent to you, all time"
          }
        />
        <Stat
          label="Unpaid by clients"
          value={formatINR(e.awaitedFromClients)}
          tone={e.awaitedFromClients > 0 ? "wait" : undefined}
          hint={
            e.awaitedFromClients > 0
              ? "Sessions you held whose payment never completed. Our team chases these."
              : "Every session you held has been paid for"
          }
        />
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-medium text-forest-900">Over time</h2>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-forest-800/10 bg-ivory-light">
          <table className="w-full min-w-[38rem] border-collapse text-[0.92rem]">
            <caption className="sr-only">
              Sessions held and your share, {range.label}
            </caption>
            <thead>
              <tr className="border-b border-forest-800/10 text-left">
                {["Period", "Sessions", "Collected", "Your share", ""].map((h, i) => (
                  <th
                    key={h || "bar"}
                    className={cn(
                      "px-5 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-ink/60",
                      i > 0 && i < 4 && "text-right"
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {e.buckets.map((b) => (
                <tr
                  key={b.key}
                  className={cn(
                    "border-b border-forest-800/[0.06] last:border-0",
                    b.sessions === 0 && "text-ink/45"
                  )}
                >
                  <th scope="row" className="whitespace-nowrap px-5 py-3 text-left font-medium">
                    {b.label}
                  </th>
                  <td className="px-5 py-3 text-right tabular-nums text-ink/75">
                    {b.sessions}
                    {b.free > 0 && (
                      <span className="ml-1 text-[0.8rem] text-ink/50">({b.free} free)</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-ink/75">
                    {formatINR(b.collected)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums text-forest-900">
                    {formatINR(b.earned)}
                  </td>
                  <td className="w-32 px-5 py-3">
                    <span className="block h-1.5 overflow-hidden rounded-full bg-forest-800/8">
                      <span
                        className="block h-full rounded-full bg-forest-700"
                        style={{ width: `${Math.round((b.earned / busiest) * 100)}%` }}
                      />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/*
        Two columns whose cards line up.

        They did not before: the right-hand heading carries a line of
        explanation and the left one does not, so its list started lower, and
        the two lists used different top margins on top of that. Rather than
        pad the shorter heading to match — which breaks again the moment a line
        wraps at some width — the four blocks are direct children of one grid
        and are placed explicitly, so both headings share row one and both
        lists share row two whatever height the headings end up.

        Below `lg` there is a single column and they stack in source order,
        which is why the markup is heading, list, heading, list.
      */}
      <section className="mt-12 grid gap-x-8 gap-y-4 lg:grid-cols-2 lg:grid-rows-[auto_1fr]">
        <div className="lg:col-start-1 lg:row-start-1">
          <h2 className="font-display text-2xl font-medium text-forest-900">By session type</h2>
        </div>
        <div className="lg:col-start-1 lg:row-start-2">
          {split.services.length === 0 ? (
            <p className="text-[0.92rem] text-ink/60">No sessions in this period.</p>
          ) : (
            <ul className="divide-y divide-forest-800/8 rounded-2xl border border-forest-800/10 bg-ivory-light px-5">
              {split.services.map((x) => (
                <li key={x.slug} className="flex items-baseline justify-between gap-4 py-3">
                  <span className="min-w-0 truncate text-[0.94rem] text-forest-900">{x.label}</span>
                  <span className="shrink-0 text-[0.88rem] tabular-nums text-ink/70">
                    {x.sessions}
                    <span className="mx-2 text-ink/30">·</span>
                    <span className="font-semibold text-forest-800">{formatINR(x.earned)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-start-2 lg:row-start-1">
          <h2 className="font-display text-2xl font-medium text-forest-900">By client</h2>
          <p className="mt-1.5 text-[0.84rem] text-ink/60">
            Your own caseload, and only on your screen.
          </p>
        </div>
        <div className="lg:col-start-2 lg:row-start-2">
          {split.clients.length === 0 ? (
            <p className="text-[0.92rem] text-ink/60">No sessions in this period.</p>
          ) : (
            <ul className="divide-y divide-forest-800/8 rounded-2xl border border-forest-800/10 bg-ivory-light px-5">
              {split.clients.slice(0, 8).map((x) => (
                <li key={x.id} className="flex items-baseline justify-between gap-4 py-3">
                  <span className="min-w-0 truncate text-[0.94rem] text-forest-900">{x.name}</span>
                  <span className="shrink-0 text-[0.88rem] tabular-nums text-ink/70">
                    {x.sessions}
                    <span className="mx-2 text-ink/30">·</span>
                    <span className="font-semibold text-forest-800">{formatINR(x.earned)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-medium text-forest-900">Payouts to you</h2>
          <Link
            href="/expert/earnings/statement"
            className="press rounded-full border border-forest-800/20 px-5 py-2.5 text-[0.88rem] font-semibold text-forest-800 transition-colors hover:border-forest-800"
          >
            Monthly statement →
          </Link>
        </div>
        <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-ink/70">
          Recorded by Emoraa when the money is actually sent. A month with no row has not been
          paid out yet — it is not missing, it is pending.
        </p>

        {e.payouts.length === 0 && e.unpaidMonths.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-forest-800/20 bg-ivory-light/60 p-10 text-center text-ink/65">
            Nothing yet. Payouts appear here once you have held sessions.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-forest-800/8 rounded-2xl border border-forest-800/10 bg-ivory-light px-5">
            {e.payouts.map((p) => (
              <li key={p.month} className="flex flex-wrap items-baseline justify-between gap-3 py-3.5">
                <span className="font-medium text-forest-900">{p.monthName}</span>
                <span className="text-[0.88rem] text-ink/70">
                  <span className="font-semibold text-forest-800">{formatINR(p.amount)}</span>
                  <span className="mx-2 text-ink/30">·</span>
                  sent {formatDateISO(p.paidAt.slice(0, 10))}
                  {p.reference && (
                    <span className="ml-2 font-mono text-[0.78rem] text-ink/45">{p.reference}</span>
                  )}
                </span>
              </li>
            ))}
            {e.unpaidMonths.map((m) => (
              <li key={m} className="flex flex-wrap items-baseline justify-between gap-3 py-3.5">
                <span className="font-medium text-forest-900">
                  {new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
                    new Date(`${m}-01T00:00:00Z`)
                  )}
                </span>
                <span className="rounded-full bg-haldi/20 px-2.5 py-1 text-[0.72rem] font-semibold text-haldi-ink">
                  Not yet sent
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-5 max-w-2xl text-[0.82rem] leading-relaxed text-ink/60">
          Something look wrong?{" "}
          <Link href="/contact" className="font-medium text-forest-800 underline underline-offset-2">
            Tell us
          </Link>{" "}
          and we will go through it with you.
        </p>
      </section>
    </section>
  );
}
