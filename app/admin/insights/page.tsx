import type { Metadata } from "next";
import Link from "next/link";
import PeriodPicker from "@/components/admin/PeriodPicker";
import { gatherInsights } from "@/lib/admin-insights";
import { resolveRange } from "@/lib/admin-period";
import { todayIST } from "@/lib/features/booking/policy";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Insights | Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * What the numbers say, as distinct from what needs doing today.
 *
 * Overview answers "is anything on fire"; this answers "how is the practice
 * going". Keeping them apart stops Overview growing into a wall of figures
 * nobody reads in a hurry.
 *
 * The period lives in the URL rather than in component state, so a view can be
 * linked, bookmarked and reloaded — and so the counting happens on the server
 * against the database instead of shipping every row to the browser to filter.
 */

/** A whole number with a label, used for every headline figure here. */
function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-forest-800/10 bg-ivory-light p-5 shadow-lift">
      <p className="text-[0.75rem] uppercase tracking-[0.16em] text-ink/70">{label}</p>
      <p className="mt-2 font-display text-[1.9rem] font-medium leading-none text-forest-900">
        {value}
      </p>
      {hint && <p className="mt-2 text-[0.82rem] leading-snug text-ink/70">{hint}</p>}
    </div>
  );
}

/** A labelled bar. Width is share-of-largest, so the biggest row fills it. */
function Bar({ label, count, of, tone = "sage" }: { label: string; count: number; of: number; tone?: "sage" | "gold" | "red" }) {
  const pct = of > 0 ? Math.round((count / of) * 100) : 0;
  const fill = { sage: "bg-forest-700", gold: "bg-gold", red: "bg-red-400" }[tone];
  return (
    <li className="py-2.5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="min-w-0 truncate text-[0.92rem] text-forest-900">{label}</span>
        <span className="shrink-0 text-[0.86rem] tabular-nums text-ink/70">
          {count}
          <span className="ml-2 text-ink/70">{pct}%</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-forest-800/8">
        <div className={cn("h-full rounded-full", fill)} style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

function Panel({
  title,
  note,
  className,
  children,
}: {
  title: string;
  note?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-forest-800/10 bg-ivory-light p-5 shadow-lift sm:p-6",
        className
      )}
    >
      <h2 className="font-display text-xl font-medium text-forest-900">{title}</h2>
      {note && <p className="mt-1.5 text-[0.85rem] leading-relaxed text-ink/70">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-[0.9rem] text-ink/70">{children}</p>;
}

const pct = (n: number, of: number) => (of > 0 ? Math.round((n / of) * 100) : 0);

export default async function AdminInsightsPage({
  searchParams,
}: {
  searchParams: { period?: string; from?: string; to?: string };
}) {
  const range = resolveRange(searchParams);
  const d = await gatherInsights(range);

  const busiest = d.demand[0];
  const quietest = d.demand.length > 1 ? d.demand[d.demand.length - 1] : null;
  const mostBooked = Math.max(1, ...d.demand.map((c) => c.count));

  return (
    <section className="wrap-wide pb-28">
      <p className="eyebrow">how the practice is going</p>
      <h1 className="h-display mt-3 text-4xl md:text-5xl">Insights</h1>
      <p className="mt-4 max-w-2xl text-ink/70">
        Counted from the live database each time you load this page. Clinical records are not read
        here — this counts bookings, clients and outcomes, never what anyone said in a session.
      </p>

      <PeriodPicker range={range} today={todayIST()} className="mt-8" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="New clients"
          value={String(d.clients.new)}
          hint={`${range.inline} · ${d.clients.total} in total`}
        />
        <Stat
          label="Bookings"
          value={String(d.bookings.inPeriod)}
          hint={`${range.inline} · ${d.bookings.total} in total`}
        />
        <Stat
          label="Clients who came back"
          value={
            d.retention.clientsWithSessions
              ? `${pct(d.retention.returning, d.retention.clientsWithSessions)}%`
              : "—"
          }
          hint={
            d.retention.clientsWithSessions
              ? `${d.retention.returning} of ${d.retention.clientsWithSessions} had more than one session · all time`
              : "No sessions booked yet"
          }
        />
        <Stat
          label="Free session → paid"
          value={d.freeSession.took ? `${pct(d.freeSession.converted, d.freeSession.took)}%` : "—"}
          hint={
            d.freeSession.took
              ? `${d.freeSession.converted} of ${d.freeSession.took} went on to pay · all time`
              : "Nobody has taken the free session yet"
          }
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel
          title="What people come for"
          note={
            busiest
              ? `Most booked: ${busiest.label}.${quietest ? ` Least: ${quietest.label}.` : ""}`
              : undefined
          }
        >
          {d.demand.length === 0 ? (
            <Empty>No bookings in this period.</Empty>
          ) : (
            <ul className="divide-y divide-forest-800/8">
              {d.demand.map((c) => (
                <Bar key={c.id} label={c.label} count={c.count} of={mostBooked} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="How bookings end"
          note="A rising no-show rate is usually a scheduling problem rather than a client problem."
        >
          {d.outcomes.decided === 0 ? (
            <Empty>No bookings in this period.</Empty>
          ) : (
            <ul className="divide-y divide-forest-800/8">
              <Bar label="Cancelled" count={d.outcomes.cancelled} of={d.outcomes.decided} tone="gold" />
              <Bar label="No-show" count={d.outcomes.noShow} of={d.outcomes.decided} tone="red" />
            </ul>
          )}
        </Panel>

        <Panel
          title="Do clients come back?"
          note={
            d.retention.clientsWithSessions
              ? `${d.retention.averagePerClient.toFixed(1)} sessions per client on average, over all time rather than the period above — a fortnight is too short to tell you whether anybody came back. Cancelled bookings are not counted; nobody attended them.`
              : "Counted once sessions are confirmed or completed, over all time."
          }
        >
          {d.retention.clientsWithSessions === 0 ? (
            <Empty>No confirmed sessions yet.</Empty>
          ) : (
            <ul className="divide-y divide-forest-800/8">
              <Bar label="One session only" count={d.retention.once} of={d.retention.clientsWithSessions} tone="gold" />
              <Bar label="Two to four" count={d.retention.few} of={d.retention.clientsWithSessions} />
              <Bar label="Five or more" count={d.retention.many} of={d.retention.clientsWithSessions} />
            </ul>
          )}
        </Panel>

        <Panel
          title="Languages asked for, against who can speak them"
          note="Every client, not just this period. Demand comes from the language they set on their own profile — the only honest signal we hold. Which therapist somebody booked says more about who had a free slot."
        >
          {d.languages.length === 0 ? (
            <Empty>No therapists listed yet.</Empty>
          ) : (
            <>
              <ul className="divide-y divide-forest-800/8">
                {d.languages.slice(0, 8).map((l) => (
                  <li key={l.language} className="flex items-baseline justify-between gap-4 py-2.5">
                    <span className="min-w-0 truncate text-[0.92rem] text-forest-900">{l.language}</span>
                    <span className="shrink-0 text-[0.86rem] tabular-nums text-ink/70">
                      {l.clients} asking
                      <span className="mx-2 text-ink/30">·</span>
                      <span className={cn(l.therapists === 0 && l.clients > 0 && "font-semibold text-red-700")}>
                        {l.therapists} can
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              {d.unknownLanguage > 0 && (
                <p className="mt-4 border-t border-forest-800/10 pt-3 text-[0.84rem] leading-relaxed text-ink/70">
                  {d.unknownLanguage} {d.unknownLanguage === 1 ? "client has" : "clients have"} not
                  set a language, so this is not yet a picture of demand. The signup form asks, but
                  the answer is optional and accounts made before it was added have none.
                </p>
              )}
            </>
          )}
        </Panel>
        <Panel
          title="Where clients are"
          className="lg:col-span-2"
          note={
            d.where.placed
              ? `${d.where.states.length} ${d.where.states.length === 1 ? "state" : "states"} · ${d.where.cities.length} ${d.where.cities.length === 1 ? "city" : "cities"}. Counted from clients who booked in this period, not from who signed up.`
              : "Counted from clients who booked in this period."
          }
        >
          {d.where.placed === 0 ? (
            <Empty>
              {d.where.unknown > 0
                ? "Nobody who booked in this period has a city on their account yet."
                : "No bookings in this period."}
            </Empty>
          ) : (
            <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
              <div>
                <p className="text-[0.75rem] uppercase tracking-[0.16em] text-ink/70">By state</p>
                <ul className="mt-1 divide-y divide-forest-800/8">
                  {d.where.states.slice(0, 8).map((s) => (
                    <Bar key={s.state} label={s.state} count={s.clients} of={d.where.placed} />
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[0.75rem] uppercase tracking-[0.16em] text-ink/70">By city</p>
                <ul className="mt-1 divide-y divide-forest-800/8">
                  {d.where.cities.slice(0, 8).map((c) => (
                    <li
                      key={`${c.city}-${c.state}`}
                      className="flex items-baseline justify-between gap-4 py-2.5"
                    >
                      <span className="min-w-0 truncate text-[0.92rem] text-forest-900">
                        {c.city}
                        <span className="ml-1.5 text-[0.8rem] text-ink/70">{c.state}</span>
                      </span>
                      <span className="shrink-0 text-[0.86rem] tabular-nums text-ink/70">
                        {c.clients}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {d.where.unknown > 0 && (
            <p className="mt-4 border-t border-forest-800/10 pt-3 text-[0.84rem] leading-relaxed text-ink/70">
              {d.where.unknown} {d.where.unknown === 1 ? "client has" : "clients have"} no city on
              their account — they signed up before the form asked. They are left out of the
              figures above rather than guessed at, and will fill in the next time they edit their
              profile.
            </p>
          )}
        </Panel>

      </div>
    </section>
  );
}
