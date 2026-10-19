import type { ReactNode } from "react";
import { site } from "@/lib/site";
import { formatDateISO } from "@/lib/utils";
import { ordinal, type PractitionerLine, type SessionDocHeader } from "@/lib/session-documents";

/**
 * Emoraa's letterhead, for every document a practitioner issues on a session:
 * the prescription a psychiatrist writes and the practice plan anyone sets.
 *
 * It is the printed stationery (forest wordmark, gold rule, forest footer band)
 * rebuilt as a page, so a client printing or saving it as a PDF gets the same
 * sheet the practice hands out on paper. `data-receipt` borrows the receipt's
 * print rules: backgrounds kept, card chrome dropped, one sheet where it fits.
 *
 * Everything in the details grid comes from `sessionDocHeader()` — read from
 * the booking, never typed — so the reference and the name are always the
 * session's own.
 */
export default function Letterhead({
  title,
  subtitle,
  docLabel,
  docNumber,
  issuedOn,
  practitioner,
  header,
  person,
  signatureNote,
  banner,
  children,
}: {
  title: string;
  subtitle?: string;
  docLabel: string;
  docNumber: string;
  /** YYYY-MM-DD */
  issuedOn: string;
  practitioner: PractitionerLine;
  header: SessionDocHeader;
  /** "Patient" on a prescription, "Client" everywhere else */
  person: "Patient" | "Client";
  signatureNote: string;
  /** shown above everything, e.g. a withdrawn notice */
  banner?: ReactNode;
  children: ReactNode;
}) {
  const rows: [string, string, string, string][] = [
    ["Booking ref.", header.bookingRef, docLabel, docNumber],
    [`${person} name`, header.clientName, "Age / Sex", header.ageSex || "—"],
    ["Session date", `${formatDateISO(header.date)} · ${header.time} IST`, "Session no.", ordinal(header.sessionNumber)],
    ["Mode", header.mode, "Language", header.language || "—"],
  ];

  return (
    <article
      data-receipt
      className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-forest-800/15 bg-white shadow-lift print:rounded-none print:border-0"
    >
      <div className="px-6 pt-8 sm:px-10 sm:pt-10">
        {banner}

        {/* ── masthead: brand left, practitioner right ─────────────────── */}
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-gold pb-6">
          <div>
            <span
              role="img"
              aria-label="emoraa."
              className="block h-8 w-[188px] bg-forest-800"
              style={{
                WebkitMask: "url(/brand/emoraa-wordmark.png) left center / contain no-repeat",
                mask: "url(/brand/emoraa-wordmark.png) left center / contain no-repeat",
              }}
            />
            <p className="mt-2 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-gold-dark">
              {site.tagline.replace(/\.$/, "")}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-xl text-forest-800">{practitioner.name}</p>
            {practitioner.credentials && (
              <p className="mt-0.5 text-[0.82rem] text-ink/80">{practitioner.credentials}</p>
            )}
            {practitioner.designation && (
              <p className="text-[0.82rem] text-sage-dark">{practitioner.designation}</p>
            )}
            {practitioner.registration && (
              <p className="text-[0.82rem] tabular-nums text-ink/80">{practitioner.registration}</p>
            )}
          </div>
        </header>

        {/* ── title + the session's own details ─────────────────────────── */}
        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-display text-2xl text-forest-800">{title}</h1>
          {subtitle && <p className="text-[0.78rem] text-sage-dark">{subtitle}</p>}
        </div>

        <table className="mt-4 w-full border-collapse text-left text-[0.84rem]">
          <tbody>
            {rows.map(([l1, v1, l2, v2]) => (
              <tr key={l1} className="border border-sage-light">
                <th scope="row" className="w-[17%] bg-ivory px-3 py-2 font-semibold text-forest-800">
                  {l1}
                </th>
                <td className="w-[33%] border-r border-sage-light px-3 py-2 text-ink">{v1}</td>
                <th scope="row" className="w-[17%] bg-ivory px-3 py-2 font-semibold text-forest-800">
                  {l2}
                </th>
                <td className="w-[33%] px-3 py-2 tabular-nums text-ink">{v2}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="py-6">{children}</div>

        {/* ── signature ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-6 pb-8">
          <p className="text-[0.82rem] text-ink/70">
            Issued on <span className="font-medium text-forest-800">{formatDateISO(issuedOn)}</span>
          </p>
          <div className="min-w-[14rem] text-right">
            <p className="border-t border-ink/60 pt-1.5 text-[0.78rem] text-sage-dark">{signatureNote}</p>
            <p className="text-[0.86rem] text-forest-800">{practitioner.name}</p>
            {practitioner.registration && (
              <p className="text-[0.78rem] tabular-nums text-ink/75">{practitioner.registration}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── footer band ─────────────────────────────────────────────────── */}
      <footer className="border-t-[3px] border-gold bg-forest-800 px-6 py-4 text-ivory sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[0.76rem]">
          <span>
            {site.url.replace(/^https?:\/\//, "")} <span className="text-gold">·</span> {site.email}{" "}
            <span className="text-gold">·</span> {site.phone}
          </span>
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-gold">
            {site.tagline.replace(/\.$/, "")}
          </span>
        </div>
        <p className="mt-1.5 text-[0.7rem] leading-relaxed text-sage">
          Confidential: for the named {person.toLowerCase()} only. Emoraa is not an emergency
          service. In a crisis, call Tele-MANAS 14416 (free, 24×7) or 112.
        </p>
      </footer>
    </article>
  );
}
