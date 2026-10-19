import type { Metadata } from "next";
import Link from "next/link";
import PeriodPicker from "@/components/admin/PeriodPicker";
import { resolveRange } from "@/lib/admin-period";
import { listExpertSessions, requireExpertContext } from "@/lib/expert-data";
import { BOOKING_STATUS } from "@/lib/features/booking/policy";
import { sessionPhase, canWriteNotes, isSessionStatus, STATUS_META } from "@/lib/expert-portal";
import { EmptyState, Panel, PanelHeader } from "@/components/expert/Panel";
import SessionsTable from "@/components/expert/SessionsTable";

export const metadata: Metadata = { title: "Sessions" };

const WHEN_OPTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "today", label: "Today" },
  { value: "past", label: "Past and closed" },
  { value: "pending", label: "Waiting on you" },
  { value: "all", label: "Everything" },
];

export default async function ExpertSessionsPage({
  searchParams,
}: {
  searchParams: { status?: string; when?: string; q?: string; period?: string; from?: string; to?: string };
}) {
  const ctx = await requireExpertContext("/expert/sessions");
  const sessionMinutes = ctx.profile.sessionMinutes;
  const now = new Date();

  const when = WHEN_OPTIONS.some((o) => o.value === searchParams.when)
    ? (searchParams.when as string)
    : "upcoming";
  const status = isSessionStatus(searchParams.status) ? searchParams.status : null;
  const q = (searchParams.q ?? "").trim();

  /* `allowFuture`, unlike every money screen: this is a calendar, and
     clamping the range to today would hide every upcoming session. The
     default is all time for the same reason — a 30-day default would open
     the page on an empty "Upcoming". */
  const range = resolveRange(searchParams, new Date(), { allowFuture: true });

  const all = await listExpertSessions(ctx.profile.expertId, sessionMinutes, {
    ...(range.from ? { from: range.from } : {}),
    ...(range.preset === "all" ? {} : { to: range.to }),
  });

  const byWhen = all.filter((s) => {
    const finished = sessionPhase(s, sessionMinutes, now) === "past";
    if (when === "upcoming") return s.status === "CONFIRMED" && !finished;
    if (when === "today") return s.date === ctx.today;
    if (when === "pending") return s.status === BOOKING_STATUS.requested;
    if (when === "past") return finished || s.status !== "CONFIRMED";
    return true;
  });

  const needle = q.toLowerCase();
  const filtered = byWhen
    .filter((s) => (status ? s.status === status : true))
    .filter((s) =>
      needle
        ? s.ref.toLowerCase().includes(needle) ||
          s.client.displayName.toLowerCase().includes(needle) ||
          s.concernLabel.toLowerCase().includes(needle)
        : true
    )
    .sort((a, b) =>
      when === "past"
        ? b.date.localeCompare(a.date) || b.time.localeCompare(a.time)
        : a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
    );

  const filtersActive =
    Boolean(status) || Boolean(q) || when !== "upcoming" || range.preset !== "all";

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader
          title="Your sessions"
          hint={
            <>
              {all.length === 0
                ? "Nothing booked yet."
                : "Showing " + filtered.length + " of " + all.length + " sessions."}{" "}
              Times are clinic time (IST). Clients appear as a first name and last initial — that is
              all this view carries.
            </>
          }
        />

        {/* filters — a plain GET form, so it works with the keyboard, the back
            button and no JavaScript at all */}
        <div className="border-b border-forest-800/10 px-5 py-4 sm:px-6">
          <PeriodPicker
            range={range}
            today={ctx.today}
            extra={{ when, ...(status ? { status } : {}), ...(q ? { q } : {}) }}
          />
          <p className="mt-2.5 text-[0.8rem] text-ink/70">
            Filters the session date. Unlike the money screens this one reaches forward too, so
            you can look at a week that has not happened yet.
          </p>
        </div>

        <form method="GET" className="border-b border-forest-800/10 px-5 py-4 sm:px-6" role="search">
          {/* keep the chosen dates when this form submits */}
          {range.preset === "custom" ? (
            <>
              <input type="hidden" name="from" value={range.from ?? ""} />
              <input type="hidden" name="to" value={range.to} />
            </>
          ) : (
            <input type="hidden" name="period" value={range.preset} />
          )}
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[9rem] flex-1 sm:flex-none">
              <label
                htmlFor="filter-when"
                className="block text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-ink/70"
              >
                Show
              </label>
              <select
                id="filter-when"
                name="when"
                defaultValue={when}
                className="mt-1.5 w-full rounded-xl border border-forest-800/15 bg-ivory px-3 py-2 text-[0.9rem] text-forest-900 focus:border-forest-700 focus:outline-none"
              >
                {WHEN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[9rem] flex-1 sm:flex-none">
              <label
                htmlFor="filter-status"
                className="block text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-ink/70"
              >
                Status
              </label>
              <select
                id="filter-status"
                name="status"
                defaultValue={status ?? ""}
                className="mt-1.5 w-full rounded-xl border border-forest-800/15 bg-ivory px-3 py-2 text-[0.9rem] text-forest-900 focus:border-forest-700 focus:outline-none"
              >
                <option value="">Any status</option>
                {(Object.keys(STATUS_META) as Array<keyof typeof STATUS_META>).map((key) => (
                  <option key={key} value={key}>
                    {STATUS_META[key].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[12rem] flex-[2]">
              <label
                htmlFor="filter-q"
                className="block text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-ink/70"
              >
                Find
              </label>
              <input
                id="filter-q"
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Reference, client, or focus area"
                className="mt-1.5 w-full rounded-xl border border-forest-800/15 bg-ivory px-3 py-2 text-[0.9rem] text-forest-900 placeholder:text-ink/70 focus:border-forest-700 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-full bg-forest-800 px-5 py-2.5 text-[0.88rem] font-semibold text-ivory transition-colors hover:bg-forest-700"
              >
                Apply
              </button>
              {filtersActive && (
                <Link
                  href="/expert/sessions"
                  className="whitespace-nowrap text-[0.86rem] font-medium text-ink/70 transition-colors hover:text-forest-900"
                >
                  Clear
                </Link>
              )}
            </div>
          </div>
        </form>

        <div className="p-5 sm:p-6">
          {filtered.length === 0 ? (
            all.length === 0 ? (
              <EmptyState
                icon="calendar"
                title="No sessions on your book yet"
                body="Once your weekly hours are published, clients can book you and every session will be listed here with its status, room and reference."
                action={
                  <Link
                    href="/expert/availability"
                    className="rounded-full bg-forest-800 px-5 py-2.5 text-[0.9rem] font-semibold text-ivory transition-colors hover:bg-forest-700"
                  >
                    Set your weekly hours
                  </Link>
                }
              />
            ) : (
              <EmptyState
                icon="search"
                title="Nothing matches those filters"
                body={
                  <>
                    {q ? <>No session matches “{q}” </> : <>No session matches </>}
                    in this view. Widen the range or clear the filters to see the rest of your book.
                  </>
                }
                action={
                  <Link
                    href="/expert/sessions"
                    className="rounded-full border border-forest-800/20 bg-ivory px-5 py-2.5 text-[0.9rem] font-semibold text-forest-800 transition-colors hover:border-forest-800/45"
                  >
                    Clear filters
                  </Link>
                }
              />
            )
          ) : (
            <SessionsTable
              sessions={filtered}
              today={ctx.today}
              showNotes={canWriteNotes(ctx.profile.notesPolicy)}
            />
          )}
        </div>
      </Panel>
    </div>
  );
}
