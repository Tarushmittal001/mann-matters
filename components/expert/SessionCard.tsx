"use client";

import Link from "next/link";
import { formatTime, formatDate, humanGap, relativeDay } from "@/lib/clinic-time";
import { sessionMinutesAway, sessionPhase } from "@/lib/expert-portal";
import type { ExpertSessionView } from "@/lib/expert-data";
import { cn } from "@/lib/utils";
import { LiveChip, StatusBadge } from "@/components/expert/Panel";
import MeetingRoom from "@/components/expert/MeetingRoom";
import SessionStatusControl from "@/components/expert/SessionStatusControl";
import { useNow } from "@/components/ui/useNow";

/**
 * The card the day is read off. Everything on it is client-safe: a first name
 * with a last initial, the concern the client picked at booking, and nothing
 * else about them.
 */
export default function SessionCard({
  session,
  sessionMinutes,
  serverNow,
  today,
  emphasis = false,
}: {
  session: ExpertSessionView;
  sessionMinutes: number;
  serverNow: string;
  today: string;
  emphasis?: boolean;
}) {
  const now = useNow(serverNow);
  const phase = sessionPhase(session, sessionMinutes, now);
  const away = sessionMinutesAway(session, now);
  const live = session.status === "CONFIRMED" && (phase === "live" || phase === "soon");

  return (
    <article
      className={cn(
        "rounded-2xl border bg-ivory-light shadow-lift transition-shadow duration-500 ease-silk",
        live
          ? "border-kesar/40 ring-1 ring-inset ring-kesar/15"
          : "border-forest-800/10 hover:shadow-bloom",
        emphasis && !live && "border-forest-800/20"
      )}
    >
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
        {/* time */}
        <div className="flex shrink-0 items-baseline gap-3 sm:w-[7.5rem] sm:flex-col sm:items-start sm:gap-0.5">
          <p className="font-display text-2xl font-medium leading-none text-forest-900 tabular-nums">
            {formatTime(session.time)}
          </p>
          <p className="text-[0.8rem] text-ink/55">
            <span className="sm:hidden">– </span>
            {formatTime(session.endTime)} IST
          </p>
          <p className="text-[0.8rem] font-medium text-forest-700 sm:mt-1">
            {relativeDay(session.date, today)}
          </p>
        </div>

        {/* who and what */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-light/70 text-[0.8rem] font-bold text-forest-800"
            >
              {session.client.initials}
            </span>
            <h3 className="font-display text-lg font-medium text-forest-900">
              <Link href={"/expert/sessions/" + session.id} className="link-draw">
                {session.client.displayName}
              </Link>
            </h3>
            {session.client.isReturning && (
              <span className="rounded-full bg-forest-800/[0.06] px-2.5 py-0.5 text-[0.72rem] font-semibold text-ink/70">
                Session {session.client.sessionsWithYou} with you
              </span>
            )}
            {live && <LiveChip label={phase === "live" ? "In session" : "Starts " + humanGap(away)} />}
            <StatusBadge status={session.status} />
          </div>

          <p className="mt-2.5 text-[0.9rem] text-ink/70">
            <span className="font-medium text-forest-900">{session.concernLabel}</span>
            {session.concernHint && <span className="text-ink/55"> · {session.concernHint}</span>}
          </p>
          <p className="mt-1 text-[0.82rem] text-ink/50">
            Ref <span className="font-mono font-semibold text-forest-800">{session.ref}</span> ·{" "}
            {sessionMinutes} min · {formatDate(session.date)}
          </p>

          <div className="mt-4">
            <MeetingRoom
              variant="compact"
              sessionId={session.id}
              date={session.date}
              time={session.time}
              status={session.status}
              meetingUrl={session.meetingUrl}
              sessionMinutes={sessionMinutes}
              serverNow={serverNow}
            />
          </div>
        </div>
      </div>

      {(session.status === "CONFIRMED" || session.status === "COMPLETED" || session.status === "NO_SHOW") && (
        <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-forest-800/10 px-5 py-3.5 sm:px-6">
          <SessionStatusControl
            compact
            session={session}
            sessionMinutes={sessionMinutes}
            serverNow={serverNow}
          />
          <Link
            href={"/expert/sessions/" + session.id}
            className="link-draw text-[0.84rem] font-medium text-forest-800"
          >
            Session details
          </Link>
        </footer>
      )}
    </article>
  );
}
