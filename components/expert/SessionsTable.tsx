import Link from "next/link";
import { formatDate, formatTime, relativeDay } from "@/lib/clinic-time";
import { formatINR } from "@/lib/utils";
import type { ExpertSessionView } from "@/lib/expert-data";
import { StatusBadge } from "@/components/expert/Panel";

/**
 * The whole book of sessions. A table on wide screens because that is what
 * scanning a ledger wants; the same rows as cards below `lg`, because a table
 * squeezed onto a phone is a table nobody reads. Both are built from one list,
 * so they can never drift apart.
 */

function RoomCell({ session }: { session: ExpertSessionView }) {
  if (session.status === "CANCELLED") return <span className="text-ink/40">—</span>;
  if (session.meetingUrl) {
    return (
      <span className="inline-flex items-center gap-1.5 text-ink/70">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-mor" />
        Link set
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-red-700">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-red-500" />
      No link
    </span>
  );
}

function NoteCell({ session }: { session: ExpertSessionView }) {
  if (!session.note) return <span className="text-ink/40">—</span>;
  return (
    <span className="text-ink/70">
      {session.note.status === "SUBMITTED" ? "Submitted" : "Draft"}
      {session.note.amendments > 0 && (
        <span className="text-ink/50">
          {" "}
          +{session.note.amendments} amendment{session.note.amendments === 1 ? "" : "s"}
        </span>
      )}
    </span>
  );
}

export default function SessionsTable({
  sessions,
  today,
  showNotes,
}: {
  sessions: ExpertSessionView[];
  today: string;
  showNotes: boolean;
}) {
  return (
    <>
      {/* wide screens */}
      <div className="rail hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[52rem] border-collapse text-left text-[0.9rem]">
          <caption className="sr-only">
            Your sessions, earliest first. All times are clinic time (IST).
          </caption>
          <thead>
            <tr className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink/50">
              <th scope="col" className="px-4 py-3 pl-5">
                When (IST)
              </th>
              <th scope="col" className="px-4 py-3">
                Client
              </th>
              <th scope="col" className="px-4 py-3">
                Focus
              </th>
              <th scope="col" className="px-4 py-3">
                Status
              </th>
              <th scope="col" className="px-4 py-3">
                Room
              </th>
              {showNotes && (
                <th scope="col" className="px-4 py-3">
                  Note
                </th>
              )}
              <th scope="col" className="px-4 py-3">
                Fee
              </th>
              <th scope="col" className="px-4 py-3 pr-5 text-right">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr
                key={s.id}
                className="border-t border-forest-800/[0.07] transition-colors hover:bg-sage-light/20"
              >
                <td className="px-4 py-3.5 pl-5">
                  <span className="block font-medium tabular-nums text-forest-900">
                    {formatTime(s.time)} – {formatTime(s.endTime)}
                  </span>
                  <span className="block text-[0.8rem] text-ink/55">
                    {relativeDay(s.date, today)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="block text-forest-900">{s.client.displayName}</span>
                  <span className="block font-mono text-[0.76rem] text-ink/50">{s.ref}</span>
                </td>
                <td className="px-4 py-3.5 text-ink/70">{s.concernLabel}</td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={s.status} />
                </td>
                <td className="px-4 py-3.5">
                  <RoomCell session={s} />
                </td>
                {showNotes && (
                  <td className="px-4 py-3.5">
                    <NoteCell session={s} />
                  </td>
                )}
                <td className="px-4 py-3.5 tabular-nums text-ink/70">{formatINR(s.amount)}</td>
                <td className="px-4 py-3.5 pr-5 text-right">
                  <Link
                    href={"/expert/sessions/" + s.id}
                    className="link-draw font-medium text-forest-800"
                  >
                    Open
                    <span className="sr-only">
                      {" "}
                      session with {s.client.displayName} on {formatDate(s.date)}
                    </span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* narrow screens */}
      <ul className="space-y-3 lg:hidden">
        {sessions.map((s) => (
          <li key={s.id}>
            <Link
              href={"/expert/sessions/" + s.id}
              className="block rounded-2xl border border-forest-800/10 bg-ivory-light p-4 shadow-lift transition-shadow hover:shadow-bloom"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg font-medium text-forest-900">
                    {s.client.displayName}
                  </p>
                  <p className="mt-0.5 text-[0.85rem] text-ink/65">
                    {relativeDay(s.date, today)} · {formatTime(s.time)}–{formatTime(s.endTime)} IST
                  </p>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[0.82rem]">
                <div>
                  <dt className="text-ink/45">Focus</dt>
                  <dd className="text-forest-900">{s.concernLabel}</dd>
                </div>
                <div>
                  <dt className="text-ink/45">Fee</dt>
                  <dd className="tabular-nums text-forest-900">{formatINR(s.amount)}</dd>
                </div>
                <div>
                  <dt className="text-ink/45">Room</dt>
                  <dd>
                    <RoomCell session={s} />
                  </dd>
                </div>
                {showNotes && (
                  <div>
                    <dt className="text-ink/45">Note</dt>
                    <dd>
                      <NoteCell session={s} />
                    </dd>
                  </div>
                )}
                <div className="col-span-2">
                  <dt className="text-ink/45">Reference</dt>
                  <dd className="font-mono text-forest-800">{s.ref}</dd>
                </div>
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
