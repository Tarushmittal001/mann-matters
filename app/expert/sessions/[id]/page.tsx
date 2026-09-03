import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getExpertSession, getSessionNote, requireExpertContext } from "@/lib/expert-data";
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
import { LiveChip, Meta, Panel, PanelHeader, StatusBadge } from "@/components/expert/Panel";
import ClientSummary from "@/components/expert/ClientSummary";
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
            <p className="mt-1.5 text-[0.9rem] text-ink/65">
              {formatDate(session.date)} · {formatTime(session.time)}–{formatTime(session.endTime)}{" "}
              clinic time ({CLINIC_TZ}) · {sessionMinutes} minutes
            </p>
            {inProfileZone && (
              <p className="mt-1 text-[0.85rem] text-ink/55">
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
                <p className="mt-4 text-[0.82rem] text-ink/55">
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
        <Panel as="aside" className="xl:sticky xl:top-28 xl:self-start">
          <PanelHeader title="Client" hint="Everything we are allowed to share with you." />
          <ClientSummary
            client={session.client}
            concernLabel={session.concernLabel}
            concernHint={session.concernHint}
          />
        </Panel>
      </div>
    </div>
  );
}
