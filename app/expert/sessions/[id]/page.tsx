import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getExpertSession,
  getSessionIntake,
  getSessionNote,
  requireExpertContext,
  clientHistory,
  pendingFollowUp,
  openOffer,
  prescriptionsFor,
} from "@/lib/expert-data";
import {
  CLINIC_TZ,
  formatClinicTime,
  formatDate,
  formatTime,
  humanGap,
  inZone,
  relativeDay,
} from "@/lib/clinic-time";
import { formatINR } from "@/lib/utils";
import { sessionMinutesAway, sessionPhase } from "@/lib/expert-portal";
import { homeworkForBooking } from "@/lib/homework";
import { LiveChip, Meta, Panel, PanelHeader, StatusBadge } from "@/components/expert/Panel";
import ClientSummary from "@/components/expert/ClientSummary";
import FollowUp from "@/components/expert/FollowUp";
import PrescriptionPad from "@/components/expert/PrescriptionPad";
import DocumentDetails from "@/components/expert/DocumentDetails";
import SendPlan from "@/components/expert/SendPlan";
import { sessionDocHeader } from "@/lib/session-documents";
import { getExpert } from "@/lib/experts-store";
import { canPrescribe } from "@/lib/professions";
import RescheduleOffer from "@/components/expert/RescheduleOffer";
import HomeworkEditor from "@/components/expert/HomeworkEditor";
import IntakeView from "@/components/expert/IntakeView";
import MeetingRoom from "@/components/expert/MeetingRoom";
import SessionNotes from "@/components/expert/SessionNotes";
import SessionStatusControl from "@/components/expert/SessionStatusControl";

export const metadata: Metadata = { title: "Session" };

export default async function ExpertSessionPage({ params }: { params: { id: string } }) {
  const ctx = await requireExpertContext("/expert/sessions/" + params.id);
  const sessionMinutes = ctx.profile.sessionMinutes;

  const session = await getExpertSession(ctx.profile.expertId, params.id, sessionMinutes);
  if (!session) notFound();

  const note = await getSessionNote(session.id, ctx.profile.expertId);
  const intake = await getSessionIntake(session.id, ctx.profile.expertId);
  const homework = await homeworkForBooking(session.id, ctx.profile.expertId);
  const [history, followUp] = await Promise.all([
    clientHistory(ctx.profile.expertId, session.userId, session.id),
    pendingFollowUp(ctx.profile.expertId, session.userId),
  ]);
  const liveOffer = await openOffer(session.id);
  /* Only a psychiatrist sees the pad. The route checks again — a component
     that is not rendered is not a security control. */
  const listing = await getExpert(ctx.profile.expertId);
  const mayPrescribe = !!listing && canPrescribe(listing.profession);
  const scripts = mayPrescribe ? await prescriptionsFor(session.id, ctx.profile.expertId) : [];
  // what the letterhead fills in on any document issued here; the booking is
  // already confirmed as this practitioner's by getExpertSession above
  const docHeader = await sessionDocHeader(session.id);
  const serverNow = new Date().toISOString();
  const now = new Date(serverNow);
  const phase = sessionPhase(session, sessionMinutes, now);
  const away = sessionMinutesAway(session, now);
  const live = session.status === "CONFIRMED" && (phase === "live" || phase === "soon");
  const inProfileZone =
    ctx.profile.timezone !== CLINIC_TZ ? inZone(session.date, session.time, ctx.profile.timezone) : null;

  return (
    <div className="space-y-6">
      <Link href="/expert/sessions" className="link-draw inline-flex text-sm font-medium text-forest-800">
        ← All sessions
      </Link>

      {/* ── header ────────────────────────────────────────────────────────── */}
      <Panel className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusBadge status={session.status} />
              {live && (
                <LiveChip label={phase === "live" ? "In session" : "Starts " + humanGap(away)} />
              )}
              <span className="font-mono text-[0.8rem] font-semibold text-forest-800">
                {session.ref}
              </span>
            </div>
            <h2 className="h-display mt-3 text-2xl md:text-3xl">
              {relativeDay(session.date, ctx.today)}, {formatClinicTime(session.time)}
            </h2>
            <p className="mt-1.5 text-[0.9rem] text-ink/70">
              {formatDate(session.date)} · {formatTime(session.time)}–{formatTime(session.endTime)}{" "}
              clinic time ({CLINIC_TZ}) · {session.lengthMinutes} minutes
              {session.serviceTitle ? ` · ${session.serviceTitle}` : ""}
            </p>
            {inProfileZone && (
              <p className="mt-1 text-[0.85rem] text-ink/70">
                On your own clock ({ctx.profile.timezone}): {inProfileZone}
              </p>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-1">
            <Meta label="Your fee">{formatINR(session.amount)}</Meta>
            <Meta label="Booked on">
              {formatDate(session.bookedAt.slice(0, 10), { year: true })}
            </Meta>
          </dl>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          {/* ── meeting room ───────────────────────────────────────────────── */}
          <Panel>
            <PanelHeader
              title="Meeting room"
              hint="You set the link; access opens 15 minutes before the session for both of you."
            />
            <div className="p-5 sm:p-6">
              <MeetingRoom
                sessionId={session.id}
                date={session.date}
                time={session.time}
                status={session.status}
                meetingUrl={session.meetingUrl}
              serviceSlug={session.serviceSlug}
                sessionMinutes={sessionMinutes}
                serverNow={serverNow}
              />
            </div>
          </Panel>

          {/* ── status ─────────────────────────────────────────────────────── */}
          <Panel>
            <PanelHeader
              title="Session status"
              hint="What you record here drives the client's record, your payout and our follow-up."
            />
            <div className="p-5 sm:p-6">
              <SessionStatusControl
                session={session}
                sessionMinutes={sessionMinutes}
                serverNow={serverNow}
              />
              {session.closedBy && (
                <p className="mt-4 text-[0.82rem] text-ink/70">
                  Last changed by{" "}
                  {session.closedBy === "EXPERT"
                    ? "you"
                    : session.closedBy === "CLIENT"
                      ? "the client"
                      : "our team"}
                  .
                </p>
              )}
            </div>
          </Panel>

          {/* ── between sessions ───────────────────────────────────────────── */}
          <Panel>
            <PanelHeader
              title="Between sessions"
              hint="One or two specific things. The client sees these on their dashboard and ticks them off."
            />
            <HomeworkEditor
              sessionId={session.id}
              items={homework.map((h) => ({
                id: h.id,
                task: h.task,
                why: h.why,
                frequency: h.frequency,
                duration: h.duration,
                dueOn: h.dueOn,
                doneAt: h.doneAt?.toISOString() ?? null,
              }))}
              canSet={session.status !== "CANCELLED"}
            />
            {homework.length > 0 && docHeader && (
              <div className="space-y-3 border-t border-forest-800/[0.08] px-5 py-5 sm:px-6">
                <DocumentDetails header={docHeader} />
                <SendPlan sessionId={session.id} />
              </div>
            )}
          </Panel>

          {/* ── notes ──────────────────────────────────────────────────────── */}
          <Panel>
            <PanelHeader
              title="Session note"
              hint="Private to you and clinical governance. The client never sees it."
            />
            <SessionNotes
              sessionId={session.id}
              date={session.date}
              time={session.time}
              status={session.status}
              policy={ctx.profile.notesPolicy}
              policyNote={ctx.profile.notesPolicyNote}
              note={note}
              serverNow={serverNow}
            />
          </Panel>
        </div>

        {/* ── client ───────────────────────────────────────────────────────── */}
        <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <Panel as="aside">
            <PanelHeader title="Client" hint="Everything we are allowed to share with you." />
            <ClientSummary
              client={session.client}
              concernLabel={session.concernLabel}
              concernHint={session.concernHint}
            />
          </Panel>

          {history.length > 0 && (
            <Panel as="aside">
              <PanelHeader
                title={`Your ${history.length + 1} sessions together`}
                hint="Only the ones with you. What they have done with anyone else is not yours to read."
              />
              <ul className="divide-y divide-forest-800/[0.08] px-5 sm:px-6">
                {history.map((h) => (
                  <li key={h.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                    <span className="text-[0.9rem] text-forest-900">
                      {formatDate(h.date, { year: true })}
                      <span className="ml-2 text-ink/70">{h.time}</span>
                    </span>
                    <span className="flex items-center gap-2 text-[0.82rem] text-ink/70">
                      <StatusBadge status={h.status as never} />
                      {h.hasNote && <span className="text-forest-700">note</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {session.status === "CONFIRMED" && (
            <Panel as="aside">
              <PanelHeader
                title="Need to move it?"
                hint="Offer other times. Nothing changes until they pick."
              />
              <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                <RescheduleOffer bookingId={session.id} today={ctx.today} live={liveOffer} />
              </div>
            </Panel>
          )}

          {mayPrescribe && (
            <Panel as="aside">
              <PanelHeader
                title="Prescription"
                hint="Issued in your name and registration number. It cannot be edited afterwards."
              />
              {docHeader && (
                <div className="px-5 pb-3 sm:px-6">
                  <DocumentDetails header={docHeader} />
                </div>
              )}
              <PrescriptionPad bookingId={session.id} issued={scripts} />
            </Panel>
          )}

          <Panel as="aside">
            <PanelHeader
              title="Another session?"
              hint="An invitation, not a booking — they decide."
            />
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <FollowUp
                bookingId={session.id}
                clientName={session.client.displayName.split(" ")[0]}
                already={followUp}
              />
            </div>
          </Panel>

          <Panel as="aside">
            <PanelHeader
              title="Intake form"
              hint="Written by the client before you met. Read it before the session, not during."
            />
            <IntakeView
              intake={intake?.form ?? null}
              updatedAt={
                intake
                  ? formatDate(intake.updatedAt.slice(0, 10), { year: true })
                  : null
              }
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
