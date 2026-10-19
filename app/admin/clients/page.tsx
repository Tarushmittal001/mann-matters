import type { Metadata } from "next";
import Link from "next/link";
import { CLIENT_SORTS, isClientSort, listClients } from "@/lib/admin-clients";
import { initialsOf } from "@/lib/expert-portal";
import { cn, formatDateISO, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Clients | Admin" };
export const dynamic = "force-dynamic";

/**
 * The client directory.
 *
 * Sorted from the URL rather than from component state, so a view can be
 * linked and the ordering happens where the data is. "Most sessions" answers
 * who the practice actually runs on; the no-show column answers who is costing
 * practitioner hours — the two questions an admin is usually here for.
 *
 * Every figure comes from `lib/admin-clients.ts`, in grouped queries rather
 * than one per row: this page was already loading every column on User,
 * `notes` among them, and a directory has no business holding what somebody
 * wrote about their own health.
 */
export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: { sort?: string };
}) {
  const sort = isClientSort(searchParams.sort) ? searchParams.sort : "recent";
  const clients = await listClients(sort);

  const placed = clients.filter((c) => c.state).length;
  const blocked = clients.filter((c) => c.blockedAt).length;

  return (
    <section className="wrap-wide pb-28">
      <p className="eyebrow">client directory</p>
      <h1 className="h-display mt-3 text-4xl md:text-5xl">Clients</h1>
      <p className="mt-4 max-w-xl text-ink/65">
        Everyone using Emoraa, and what they have booked. Open a name for their full history.
      </p>

      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-[0.86rem] text-ink/60">
        <span>
          <span className="font-semibold text-forest-800">{clients.length}</span> in total
        </span>
        {blocked > 0 && (
          <span>
            <span className="font-semibold text-red-700">{blocked}</span> blocked
          </span>
        )}
        {clients.length > placed && (
          <span>
            {clients.length - placed} have no city yet — they signed up before the form asked.
          </span>
        )}
      </div>

      <nav aria-label="Sort clients" className="mt-7 flex flex-wrap gap-2">
        {CLIENT_SORTS.map((s) => (
          <Link
            key={s.value}
            href={`/admin/clients?sort=${s.value}`}
            aria-current={s.value === sort ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              s.value === sort
                ? "border-forest-800 bg-forest-800 text-ivory"
                : "border-forest-800/15 text-forest-800 hover:border-forest-800"
            )}
          >
            {s.label}
          </Link>
        ))}
      </nav>

      {clients.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-forest-800/20 bg-ivory-light/60 p-12 text-center text-ink/70">
          No clients have signed up yet.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-forest-800/10 bg-ivory-light">
          <table className="w-full min-w-[54rem] border-collapse text-[0.9rem]">
            <caption className="sr-only">
              Every client, with sessions, no-shows and what they have spent
            </caption>
            <thead>
              <tr className="border-b border-forest-800/10 text-left">
                {["Client", "Where", "Joined", "Sessions", "No-shows", "Cancelled", "Spent"].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={cn(
                        "px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink/60",
                        i >= 3 && "text-right"
                      )}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr
                  key={c.id}
                  className={cn(
                    "border-b border-forest-800/[0.06] last:border-0",
                    c.blockedAt && "bg-red-50/40"
                  )}
                >
                  <th scope="row" className="px-4 py-3 text-left font-normal">
                    <Link
                      href={`/admin/clients/${c.id}`}
                      className="group flex items-center gap-3"
                    >
                      {/* plain <img>: an uploaded avatar is served by a route
                          that checks the viewer's session */}
                      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-sage-light/60">
                        {c.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[0.72rem] font-semibold text-forest-800/70">
                            {initialsOf(c.name)}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-medium text-forest-900 group-hover:underline group-hover:underline-offset-2">
                            {c.name}
                          </span>
                          {c.blockedAt && (
                            <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[0.68rem] font-semibold text-red-800">
                              Blocked
                            </span>
                          )}
                          {!c.emailVerified && !c.blockedAt && (
                            <span className="shrink-0 rounded-full bg-gold/25 px-2 py-0.5 text-[0.68rem] font-semibold text-gold-dark">
                              Pending
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-[0.8rem] text-ink/60">{c.email}</span>
                      </span>
                    </Link>
                  </th>
                  <td className="px-4 py-3 text-ink/75">
                    {c.city || c.state ? (
                      [c.city, c.state].filter(Boolean).join(", ")
                    ) : (
                      <span className="text-ink/45">Not given</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink/70">
                    {formatDateISO(c.joined.slice(0, 10))}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className="font-semibold text-forest-800">{c.attended}</span>
                    {c.bookings !== c.attended && (
                      <span className="ml-1.5 text-[0.8rem] text-ink/50">of {c.bookings}</span>
                    )}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right tabular-nums",
                      c.noShows > 0 ? "font-semibold text-red-700" : "text-ink/45"
                    )}
                  >
                    {c.noShows || "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink/70">
                    {c.cancelled || <span className="text-ink/45">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-forest-900">
                    {c.spent ? formatINR(c.spent) : <span className="text-ink/45">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
