import { formatDate } from "@/lib/clinic-time";
import { WITHHELD_FROM_EXPERTS, type ClientSafeClient } from "@/lib/expert-portal";

/**
 * The client, as the practitioner is allowed to see them.
 *
 * The list at the bottom is not decoration. Practitioners ask where the rest of
 * the record is, and an unexplained gap gets worked around — by asking the
 * client for details in session, or by keeping a private spreadsheet. Naming
 * what is withheld, and why, is what makes the boundary hold.
 */
export default function ClientSummary({
  client,
  concernLabel,
  concernHint,
}: {
  client: ClientSafeClient;
  concernLabel: string;
  concernHint: string;
}) {
  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage-light/70 font-display text-lg font-semibold text-forest-800"
        >
          {client.initials}
        </span>
        <div className="min-w-0">
          <p className="font-display text-xl font-medium text-forest-900">{client.displayName}</p>
          <p className="mt-0.5 text-[0.86rem] text-ink/60">
            {client.maskedEmail}
            <span className="ml-2 text-ink/45">masked</span>
          </p>
        </div>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink/45">
            Sessions with you
          </dt>
          <dd className="mt-1 text-[0.94rem] text-forest-900">
            {client.sessionsWithYou}
            {client.isReturning ? (
              <span className="ml-2 text-[0.82rem] text-ink/55">returning client</span>
            ) : (
              <span className="ml-2 text-[0.82rem] text-ink/55">first time with you</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink/45">
            With mann Matters since
          </dt>
          <dd className="mt-1 text-[0.94rem] text-forest-900">{formatDate(client.clientSince)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink/45">
            What they came for
          </dt>
          <dd className="mt-1 text-[0.94rem] text-forest-900">
            {concernLabel}
            {concernHint && <span className="text-ink/60"> — {concernHint}</span>}
          </dd>
        </div>
      </dl>

      <div className="mt-6 rounded-xl border border-forest-800/10 bg-forest-800/[0.03] px-4 py-4">
        <p className="flex items-center gap-2 text-[0.82rem] font-semibold text-forest-900">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="text-forest-600"
          >
            <rect x="4.5" y="10.5" width="15" height="10" rx="3" />
            <path d="M8 10.5V8a4 4 0 1 1 8 0v2.5" />
          </svg>
          Not shared with you
        </p>
        <ul className="mt-2 space-y-1 text-[0.83rem] leading-relaxed text-ink/65">
          {WITHHELD_FROM_EXPERTS.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-ink/30" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[0.8rem] leading-relaxed text-ink/55">
          If you need to reach this client outside a session, our care team does it for you — that
          way consent is recorded. Ask through the session page or write to the clinical inbox.
        </p>
      </div>
    </div>
  );
}
