import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PrintButton from "@/components/booking/PrintButton";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseItems } from "@/lib/prescriptions";
import Letterhead from "@/components/documents/Letterhead";
import { formatAgeSex, sessionDocHeader } from "@/lib/session-documents";
import { formatDateISO } from "@/lib/utils";
import { currentAge } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Prescription",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * One prescription, laid out to be printed.
 *
 * Same approach as the receipt: a print-styled page rather than a generated
 * PDF, so there is no PDF library in the bundle and what the patient sees on
 * screen is exactly what comes out of the printer.
 *
 * ── WHO CAN OPEN IT ────────────────────────────────────────────────────────
 * The patient it was written for, the prescriber who wrote it, and an admin.
 * Anybody else gets a 404 rather than a 403 — a 403 would confirm that a
 * prescription with that id exists, which is itself a fact about somebody's
 * health.
 */
export default async function PrescriptionPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect(`/login?next=/prescription/${params.id}`);

  const rx = await prisma.prescription.findUnique({
    where: { id: params.id },
    include: { user: { select: { id: true, name: true, age: true, dateOfBirth: true, gender: true } } },
  });
  if (!rx) notFound();

  let allowed = rx.userId === session.sub || session.role === "ADMIN";
  if (!allowed && session.role === "EXPERT") {
    const profile = await prisma.expertProfile.findUnique({
      where: { userId: session.sub },
      select: { expertId: true },
    });
    allowed = profile?.expertId === rx.expertId;
  }
  if (!allowed) notFound();

  const items = parseItems(rx.items);
  const back =
    session.role === "EXPERT" && rx.bookingId ? `/expert/sessions/${rx.bookingId}` : "/dashboard";
  const header = (rx.bookingId ? await sessionDocHeader(rx.bookingId) : null) ?? {
    // only a prescription written outside a session lacks one; none are today
    bookingRef: "—",
    date: rx.issuedAt.toISOString().slice(0, 10),
    time: "—",
    sessionNumber: 1,
    clientName: rx.user.name,
    ageSex: formatAgeSex(currentAge(rx.user), rx.user.gender),
    language: "",
    mode: "Online session",
  };

  return (
    <div className="wrap page-top pb-24">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link href={back} className="link-draw text-sm font-medium text-forest-700">
          ← Back
        </Link>
        <PrintButton label="Print or save as PDF" />
      </div>

      <Letterhead
        title="Prescription"
        subtitle="Issued after an online consultation"
        docLabel="Rx no."
        docNumber={rx.number}
        issuedOn={rx.issuedAt.toISOString().slice(0, 10)}
        /* the prescriber as they were when they signed it — snapshotted, see lib/prescriptions */
        practitioner={{
          name: rx.prescriberName,
          credentials: rx.prescriberCreds,
          designation: "Psychiatrist",
          registration: `Reg. no. ${rx.registrationNo}`,
        }}
        header={header}
        person="Patient"
        signatureNote="Digitally issued, no wet signature"
        banner={
          rx.cancelledAt && (
            <p className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[0.9rem] font-semibold text-red-800">
              WITHDRAWN on {formatDateISO(rx.cancelledAt.toISOString().slice(0, 10))}. Do not dispense
              against this prescription.
              {rx.cancelReason ? ` Reason: ${rx.cancelReason}` : ""}
            </p>
          )
        }
      >
        <p className="font-display text-3xl text-forest-800">℞</p>
        <table className="mt-3 w-full border-collapse text-left text-[0.86rem]">
          <thead>
            <tr className="border border-sage-light bg-ivory text-forest-800">
              <th className="px-3 py-2 font-semibold">#</th>
              <th className="px-3 py-2 font-semibold">Medicine</th>
              <th className="px-3 py-2 font-semibold">Dose</th>
              <th className="px-3 py-2 font-semibold">Frequency</th>
              <th className="px-3 py-2 font-semibold">Duration</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border border-sage-light align-top">
                <td className="px-3 py-2.5 text-sage-dark">{i + 1}</td>
                <td className="px-3 py-2.5">
                  <span className="font-medium text-forest-900">{it.drug}</span>
                  {it.strength && <span className="ml-1.5 text-ink/75">{it.strength}</span>}
                  {it.instructions && (
                    <span className="mt-0.5 block text-[0.82rem] italic text-ink/70">{it.instructions}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-ink/85">{it.dose}</td>
                <td className="px-3 py-2.5 text-ink/85">{it.frequency}</td>
                <td className="px-3 py-2.5 text-ink/85">{it.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {(rx.advice || rx.followUpDays > 0) && (
          <section className="mt-6">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-gold-dark">
              Advice
            </p>
            {rx.advice && (
              <p className="mt-1.5 whitespace-pre-wrap text-[0.92rem] leading-relaxed text-ink/85">
                {rx.advice}
              </p>
            )}
            {rx.followUpDays > 0 && (
              <p className="mt-2 text-[0.92rem] font-medium text-forest-800">
                Review in {rx.followUpDays} days.
              </p>
            )}
          </section>
        )}

        <p className="mt-6 text-[0.78rem] leading-relaxed text-ink/65">
          Take only as directed and finish the course unless your prescriber tells you otherwise. If
          you have a bad reaction, stop and contact them or a doctor near you.
        </p>
      </Letterhead>
    </div>
  );
}
