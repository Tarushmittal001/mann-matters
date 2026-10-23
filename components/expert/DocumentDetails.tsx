import { formatDateISO } from "@/lib/utils";
import { ordinal, type SessionDocHeader } from "@/lib/session-documents";

/**
 * What the letterhead will say about this session, shown to the practitioner
 * while they write, so they can see it is already filled in and check it is
 * the right person before anything is issued. Read-only on purpose: these come
 * from the booking and the client's profile, not from the practitioner.
 */
export default function DocumentDetails({ header }: { header: SessionDocHeader }) {
  const items: [string, string][] = [
    ["Booking ref.", header.bookingRef],
    ["Name", header.clientName],
    ["Age / Sex", header.ageSex || "Not on profile"],
    ["Session", `${ordinal(header.sessionNumber)} · ${formatDateISO(header.date)}`],
    ["Language", header.language || "Not on profile"],
  ];
  return (
    <div className="rounded-xl border border-sage-light bg-ivory/60 px-3.5 py-3">
      <p className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-gold-dark">
        Filled in on the letterhead
      </p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.82rem]">
        {items.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-ink/70">{label}</dt>
            <dd className="min-w-0 truncate text-forest-900">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
