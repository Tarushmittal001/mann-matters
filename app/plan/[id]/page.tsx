import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PrintButton from "@/components/booking/PrintButton";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { practicePlan } from "@/lib/homework";
import Letterhead from "@/components/documents/Letterhead";
import { practitionerLine, sessionDocHeader } from "@/lib/session-documents";
import { formatDateISO } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Practice plan",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * What the client does between sessions, as a document they can keep.
 *
 * ── DELIBERATELY NOT A PRESCRIPTION ────────────────────────────────────────
 * Any practitioner can set practice — breathing, journalling, a behavioural
 * experiment — and writing it down properly, with how often and for how long,
 * is what turns advice into something somebody can follow. But "prescription"
 * means a registered medical practitioner authorising a medicine, and
 * borrowing the word here would blur the one line this codebase works hardest
 * to hold. The page says what it is, and says what it is not.
 *
 * ── WHO CAN OPEN IT ────────────────────────────────────────────────────────
 * The client, the practitioner who set it, and an admin. Anyone else gets a
 * 404: a 403 would confirm that this person had this session.
 */
export default async function PlanPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect(`/login?next=/plan/${params.id}`);

  const plan = await practicePlan(params.id);
  if (!plan) notFound();

  let allowed = plan.userId === session.sub || session.role === "ADMIN";
  if (!allowed && session.role === "EXPERT") {
    const profile = await prisma.expertProfile.findUnique({
      where: { userId: session.sub },
      select: { expertId: true },
    });
    allowed = profile?.expertId === plan.expertId;
  }
  if (!allowed) notFound();

  const [header, practitioner] = await Promise.all([
    sessionDocHeader(plan.bookingId),
    practitionerLine(plan.expertId, plan.expertName),
  ]);
  if (!header) notFound();
  const back = session.role === "EXPERT" ? `/expert/sessions/${plan.bookingId}` : "/dashboard";

  return (
    <div className="wrap page-top pb-24">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link href={back} className="link-draw text-sm font-medium text-forest-700">
          ← Back
        </Link>
        <PrintButton label="Print or save as PDF" />
      </div>

      <Letterhead
        title="Practice plan"
        subtitle="Between now and your next session"
        docLabel="Document"
        docNumber="Practice plan"
        issuedOn={plan.date}
        practitioner={practitioner}
        header={header}
        person="Client"
        signatureNote="Set by your practitioner on Emoraa"
      >
        <ol className="space-y-5">
          {plan.items.map((it, i) => (
            <li key={it.id} className="border-b border-forest-800/[0.08] pb-5 last:border-0 last:pb-0">
              <p className="font-medium text-forest-900">
                {i + 1}. {it.task}
                {it.doneAt && (
                  <span className="ml-2 text-[0.8rem] font-normal text-forest-700">done</span>
                )}
              </p>
              {(it.frequency || it.duration) && (
                <p className="mt-1 text-[0.9rem] text-ink/75">
                  {[it.frequency, it.duration].filter(Boolean).join(" · ")}
                </p>
              )}
              {it.why && (
                <p className="mt-1.5 text-[0.88rem] leading-relaxed italic text-ink/70">{it.why}</p>
              )}
              {it.dueOn && (
                <p className="mt-1 text-[0.84rem] text-ink/70">By {formatDateISO(it.dueOn)}</p>
              )}
            </li>
          ))}
        </ol>

        <p className="mt-6 text-[0.84rem] leading-relaxed text-ink/75">
          Do what you can. Missing one is not failing — tell {practitioner.name.split(" ")[0]} what
          got in the way and it becomes something to work with.
        </p>
        <p className="mt-4 rounded-lg bg-forest-800/[0.04] px-3.5 py-2.5 text-[0.78rem] leading-relaxed text-ink/70">
          <strong>This is a practice plan, not a prescription.</strong> It contains no medicine and
          nothing here replaces advice from a doctor. If you take medication, keep taking it as
          your prescriber directed.
        </p>
      </Letterhead>
    </div>
  );
}
