import type { Metadata } from "next";
import Link from "next/link";
import {
  getAvailability,
  getTimeOff,
  listExpertSessions,
  requireExpertContext,
} from "@/lib/expert-data";
import {
  addDays,
  formatTime,
  formatTimeRange,
  humanGap,
  relativeDay,
  weekdayOf,
} from "@/lib/clinic-time";
import {
  sessionMinutesAway,
  sessionPhase,
  timeOffCoversSession,
  weeklyHours,
} from "@/lib/expert-portal";
import { EmptyState, InlineAlert, Panel, PanelHeader } from "@/components/expert/Panel";
import SessionCard from "@/components/expert/SessionCard";

export const metadata: Metadata = { title: "Today" };

export default async function ExpertTodayPage() {
  const ctx = await requireExpertContext("/expert");
  const { expertId, sessionMinutes } = { expertId: ctx.profile.expertId, sessionMinutes: ctx.profile.sessionMinutes };
  const serverNow = new Date().toISOString();
  const now = new Date(serverNow);
  const today = ctx.today;

  const [sessions, bands, timeOff] = await Promise.all([
    listExpertSessions(expertId, sessionMinutes, {
      from: addDays(today, -30),
      to: addDays(today, 21),
    }),
    getAvailability(expertId),
    getTimeOff(expertId, today),
  ]);

  const todays = sessions.filter((s) => s.date === today);
  const liveOrNext = todays.find(
    (s) => s.status === "CONFIRMED" && sessionPhase(s, sessionMinutes, now) !== "past"
  );

  /* Finished-but-unrecorded sessions from earlier days. Today's are already on
     the day's own list above, with the same buttons — listing them twice just
     makes the page look longer than the work is. */
  const awaitingOutcome = sessions.filter(
    (s) =>
      s.status === "CONFIRMED" &&
      s.date < today &&
      sessionPhase(s, sessionMinutes, now) === "past"
  );

  const horizon = addDays(today, 14);
  const upcoming = sessions.filter(
    (s) => s.status === "CONFIRMED" && s.date > today && s.date <= horizon
  );

  const missingLink = [...todays, ...upcoming].filter(
    (s) => s.status === "CONFIRMED" && !s.meetingUrl && sessionPhase(s, sessionMinutes, now) !== "past"
  );

  const weekEnd = addDays(today, 7);
  const thisWeek = sessions.filter(
    (s) => s.status === "CONFIRMED" && s.date >= today && s.date < weekEnd
  );

  const offToday = timeOff.filter((b) => today >= b.startDate && today <= b.endDate);
  const clashesWithTimeOff = [...todays, ...upcoming].filter(
    (s) =>
      s.status === "CONFIRMED" &&
      timeOff.some((b) => timeOffCoversSession(b, s, sessionMinutes))
  );

  const todaysBands = bands.filter((b) => b.weekday === weekdayOf(today));

  const stats = [
    { label: "Sessions today", value: String(todays.filter((s) => s.status === "CONFIRMED").length) },
    {
      label: "Next session",
      value: liveOrNext ? humanGap(sessionMinutesAway(liveOrNext, now)) : "—",
      hint: liveOrNext ? liveOrNext.client.displayName : "Nothing left today",
    },
    { label: "Next 7 days", value: String(thisWeek.length) },
    {
      label: "Bookable hours a week",
      value: bands.length === 0 ? "0" : String(weeklyHours(bands)),
      hint: bands.length === 0 ? "No hours set" : undefined,
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── the strip that answers "what is my day" ───────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-forest-800/10 bg-ivory-light px-4 py-4 shadow-lift sm:px-5"
          >
            <p className="font-display text-2xl font-medium leading-tight text-forest-900 sm:text-[1.75rem]">
              {s.value}
            </p>
            <p className="mt-1 text-[0.8rem] leading-snug text-ink/60">{s.label}</p>
            {s.hint && <p className="mt-0.5 text-[0.76rem] text-ink/45">{s.hint}</p>}
          </div>
        ))}
      </div>

      {/* ── things that need a decision ───────────────────────────────────── */}
      {(bands.length === 0 || missingLink.length > 0 || offToday.length > 0 || clashesWithTimeOff.length > 0) && (
        <div className="space-y-3">
          {bands.length === 0 && (
            <InlineAlert
              tone="warning"
              title="You have no bookable hours set"
              action={
                <Link
                  href="/expert/availability"
                  className="inline-flex rounded-full bg-forest-800 px-4 py-2 text-[0.84rem] font-semibold text-ivory transition-colors hover:bg-forest-700"
                >
                  Set your weekly hours
                </Link>
              }
            >
              <p>
                Until you add at least one block, you will not appear in booking search and no new
                clients can reach you. Sessions already on your calendar are unaffected.
              </p>
            </InlineAlert>
          )}

          {missingLink.length > 0 && (
            <InlineAlert
              tone="danger"
              title={
                missingLink.length === 1
                  ? "One upcoming session has no meeting link"
                  : missingLink.length + " upcoming sessions have no meeting link"
              }
            >
              <ul className="space-y-1">
                {missingLink.slice(0, 4).map((s) => (
                  <li key={s.id}>
                    <Link href={"/expert/sessions/" + s.id} className="link-draw font-medium">
                      {relativeDay(s.date, today)} · {formatTime(s.time)} IST ·{" "}
                      {s.client.displayName}
                    </Link>
                  </li>
                ))}
                {missingLink.length > 4 && <li>and {missingLink.length - 4} more.</li>}
              </ul>
            </InlineAlert>
          )}

          {offToday.length > 0 && (
            <InlineAlert tone="info" title="You are marked as away today">
              <p>
                {offToday[0].allDay
                  ? "All day."
                  : formatTimeRange(offToday[0].startTime ?? "00:00", offToday[0].endTime ?? "23:59")}{" "}
                New bookings are closed for these dates.{" "}
                <Link href="/expert/availability" className="link-draw font-medium">
                  Manage time off
                </Link>
              </p>
            </InlineAlert>
          )}

          {clashesWithTimeOff.length > 0 && (
            <InlineAlert
              tone="warning"
              title={
                clashesWithTimeOff.length === 1
                  ? "One confirmed session sits inside your time off"
                  : clashesWithTimeOff.length + " confirmed sessions sit inside your time off"
              }
            >
              <p>
                Time off closes new bookings but never cancels a session someone has already paid
                for. Reschedule or cancel each one so the client is not left waiting.
              </p>
              <ul className="mt-1 space-y-1">
                {clashesWithTimeOff.slice(0, 4).map((s) => (
                  <li key={s.id}>
                    <Link href={"/expert/sessions/" + s.id} className="link-draw font-medium">
                      {relativeDay(s.date, today)} · {formatTime(s.time)} IST · {s.ref}
                    </Link>
                  </li>
                ))}
              </ul>
            </InlineAlert>
          )}
        </div>
      )}

      {/* ── today ─────────────────────────────────────────────────────────── */}
      <section aria-labelledby="today-heading">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h2 id="today-heading" className="font-display text-2xl font-medium text-forest-900">
            Today
          </h2>
          <p className="text-[0.84rem] text-ink/55">
            {todaysBands.length > 0 ? (
              <>
                Your hours:{" "}
                {todaysBands.map((b, i) => (
                  <span key={b.id ?? i}>
                    {i > 0 && ", "}
                    {formatTimeRange(b.start, b.end)}
                  </span>
                ))}
              </>
            ) : (
              <>No bookable hours on {relativeDay(today, today).toLowerCase()}.</>
            )}
          </p>
        </div>

        {todays.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon="check"
              title="Nothing booked today"
              body={
                bands.length === 0
                  ? "You have no availability set, so nothing can be booked. Add your weekly hours and clients can start finding you."
                  : "A clear day. Your next session is listed below when there is one — nothing else needs you here."
              }
              action={
                bands.length === 0 ? (
                  <Link
                    href="/expert/availability"
                    className="rounded-full bg-forest-800 px-5 py-2.5 text-[0.9rem] font-semibold text-ivory transition-colors hover:bg-forest-700"
                  >
                    Set your weekly hours
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {todays.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                sessionMinutes={sessionMinutes}
                serverNow={serverNow}
                today={today}
                emphasis
              />
            ))}
          </div>
        )}
      </section>

      {/* ── outcomes still open ───────────────────────────────────────────── */}
      {awaitingOutcome.length > 0 && (
        <Panel>
          <PanelHeader
            title="Waiting on your outcome"
            hint="Finished on an earlier day and still marked confirmed. Recording the outcome is what releases the payout and closes the client's record."
          />
          <div className="space-y-4 p-5 sm:p-6">
            {awaitingOutcome.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                sessionMinutes={sessionMinutes}
                serverNow={serverNow}
                today={today}
              />
            ))}
          </div>
        </Panel>
      )}

      {/* ── the fortnight ahead ───────────────────────────────────────────── */}
      <section aria-labelledby="upcoming-heading">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h2 id="upcoming-heading" className="font-display text-2xl font-medium text-forest-900">
            Next 14 days
          </h2>
          <Link href="/expert/sessions" className="link-draw text-sm font-medium text-forest-800">
            All sessions
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon="calendar"
              title="Nothing booked in the next fortnight"
              body="When a client books you, it appears here and you get a notification on the channel you chose."
              action={
                <Link
                  href="/expert/notifications"
                  className="rounded-full border border-forest-800/20 bg-ivory px-5 py-2.5 text-[0.9rem] font-semibold text-forest-800 transition-colors hover:border-forest-800/45"
                >
                  Check notification settings
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {upcoming.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                sessionMinutes={sessionMinutes}
                serverNow={serverNow}
                today={today}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
