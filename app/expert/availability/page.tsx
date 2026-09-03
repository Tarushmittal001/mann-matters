import type { Metadata } from "next";
import { getAvailability, getTimeOff, requireExpertContext } from "@/lib/expert-data";
import {
  WEEKDAYS,
  addDays,
  formatDayMonth,
  formatTimeRange,
  relativeDay,
  weekdayOf,
} from "@/lib/clinic-time";
import { Panel, PanelHeader } from "@/components/expert/Panel";
import AvailabilityEditor from "@/components/expert/AvailabilityEditor";
import TimeOffEditor from "@/components/expert/TimeOffEditor";

export const metadata: Metadata = { title: "Availability" };

export default async function ExpertAvailabilityPage() {
  const ctx = await requireExpertContext("/expert/availability");
  const [bands, timeOff] = await Promise.all([
    getAvailability(ctx.profile.expertId),
    getTimeOff(ctx.profile.expertId, ctx.today),
  ]);

  /* A week of what the two settings add up to — the thing neither editor can
     show on its own. */
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(ctx.today, i);
    const dayBands = bands.filter((b) => b.weekday === weekdayOf(date));
    const away = timeOff.filter((b) => date >= b.startDate && date <= b.endDate);
    return { date, dayBands, away };
  });

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader
          title="The next seven days"
          hint="Your weekly hours with time off already taken out — what a client actually sees when they try to book you."
        />
        <div className="rail overflow-x-auto p-5 sm:p-6">
          <ul className="flex min-w-max gap-2.5">
            {week.map(({ date, dayBands, away }, i) => {
              const closed = dayBands.length === 0;
              const blocked = away.length > 0;
              const allDayBlock = away.some((b) => b.allDay);
              return (
                <li
                  key={date}
                  className={
                    "w-[9.5rem] shrink-0 rounded-xl border px-3.5 py-3 " +
                    (blocked
                      ? "border-neel/25 bg-neel/[0.05]"
                      : closed
                        ? "border-forest-800/10 bg-forest-800/[0.02]"
                        : "border-forest-800/12 bg-ivory")
                  }
                >
                  <p className="text-[0.8rem] font-semibold text-forest-900">
                    {WEEKDAYS[weekdayOf(date)].long}
                  </p>
                  <p className="text-[0.72rem] text-ink/50">
                    {i < 2 ? relativeDay(date, ctx.today) + " · " : ""}
                    {formatDayMonth(date)}
                  </p>
                  <div className="mt-2 space-y-1 text-[0.78rem]">
                    {blocked && allDayBlock ? (
                      <p className="font-semibold text-neel-ink">Away all day</p>
                    ) : closed ? (
                      <p className="text-ink/45">Not bookable</p>
                    ) : (
                      dayBands.map((b, j) => (
                        <p key={b.id ?? j} className="text-ink/75 tabular-nums">
                          {formatTimeRange(b.start, b.end)}
                        </p>
                      ))
                    )}
                    {blocked && !allDayBlock && (
                      <p className="font-medium text-neel-ink">Part of the day blocked</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Weekly hours"
          hint="The repeating shape of your week. Everything here is clinic time (IST), whatever clock you are on."
        />
        <AvailabilityEditor
          initialBands={bands}
          sessionMinutes={ctx.profile.sessionMinutes}
          today={ctx.today}
        />
      </Panel>

      <Panel>
        <PanelHeader
          title="Time off"
          hint="One-off blocks that sit on top of your weekly hours — leave, travel, or an afternoon you need back."
        />
        <TimeOffEditor blocks={timeOff} today={ctx.today} />
      </Panel>
    </div>
  );
}
