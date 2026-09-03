"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  WEEKDAYS,
  formatDate,
  formatTime,
  minutesToTime,
  relativeDay,
  timeToMinutes,
} from "@/lib/clinic-time";
import {
  MAX_BANDS_PER_DAY,
  overlappingBands,
  validateBand,
  weeklyHours,
  type AvailabilityBand,
} from "@/lib/expert-portal";
import { cn } from "@/lib/utils";
import { ActionButton, SaveBar, Select } from "@/components/expert/controls";
import { InlineAlert } from "@/components/expert/Panel";
import { send, stampNow } from "@/components/expert/request";
import { useToast } from "@/components/expert/Toast";

/**
 * The weekly grid of bookable hours.
 *
 * Overlaps are caught here, before the request, and marked on the rows that
 * clash rather than as a sentence at the bottom. What the server sends back is
 * the thing this screen cannot know: sessions already sold that the new grid no
 * longer covers. Those are never cancelled silently — they are listed, and the
 * practitioner decides.
 */

type Row = AvailabilityBand & { key: string };

const SLOTS = (() => {
  const out: string[] = [];
  for (let m = 5 * 60; m <= 23 * 60 + 30; m += 30) out.push(minutesToTime(m));
  return out;
})();

let seq = 0;
const nextKey = () => "band-" + (seq += 1);

function toRows(bands: AvailabilityBand[]): Row[] {
  return bands.map((b) => ({ ...b, key: nextKey() }));
}

function serialise(rows: Row[]) {
  return JSON.stringify(
    [...rows]
      .sort((a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start))
      .map((r) => [r.weekday, r.start, r.end])
  );
}

export default function AvailabilityEditor({
  initialBands,
  sessionMinutes,
  today,
}: {
  initialBands: AvailabilityBand[];
  sessionMinutes: number;
  today: string;
}) {
  const router = useRouter();
  const { saved, failed, toast } = useToast();

  const [rows, setRows] = useState<Row[]>(() => toRows(initialBands));
  const [baseline, setBaseline] = useState(() => serialise(toRows(initialBands)));
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Array<{ id: string; ref: string; date: string; time: string }> | null>(
    null
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const dirty = serialise(rows) !== baseline;

  const clashKeys = useMemo(() => {
    const pairs = overlappingBands(rows);
    const keys = new Set<string>();
    pairs.forEach(([a, b]) => {
      keys.add(rows[a].key);
      keys.add(rows[b].key);
    });
    return keys;
  }, [rows]);

  const rowErrors = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      const problem = validateBand(r);
      if (problem) map.set(r.key, problem);
      else if (clashKeys.has(r.key)) map.set(r.key, "Overlaps another block on this day.");
    });
    return map;
  }, [rows, clashKeys]);

  const blocked = rowErrors.size > 0;

  const addBand = (weekday: number) => {
    const onDay = rows.filter((r) => r.weekday === weekday);
    if (onDay.length >= MAX_BANDS_PER_DAY) {
      toast({
        tone: "info",
        title: "That is the most blocks we allow in a day",
        detail: "Up to " + MAX_BANDS_PER_DAY + " per day keeps the booking calendar readable.",
      });
      return;
    }
    const last = onDay.sort((a, b) => a.start.localeCompare(b.start)).at(-1);
    const start = last ? last.end : "10:00";
    const end = minutesToTime(Math.min(timeToMinutes(start) + 180, 23 * 60 + 30));
    setRows((all) => [...all, { key: nextKey(), weekday, start, end }]);
  };

  const update = (key: string, patch: Partial<AvailabilityBand>) =>
    setRows((all) => all.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const remove = (key: string) => setRows((all) => all.filter((r) => r.key !== key));

  const copyMondayToWeekdays = () => {
    const monday = rows.filter((r) => r.weekday === 1);
    if (monday.length === 0) return;
    setRows((all) => [
      ...all.filter((r) => r.weekday === 0 || r.weekday === 1 || r.weekday === 6),
      ...[2, 3, 4, 5].flatMap((weekday) =>
        monday.map((m) => ({ key: nextKey(), weekday, start: m.start, end: m.end }))
      ),
    ]);
    toast({ tone: "info", title: "Monday copied to Tuesday–Friday", detail: "Nothing is saved until you press Save." });
  };

  const save = async () => {
    setBusy(true);
    setServerError(null);
    const result = await send<{
      conflicts?: Array<{ id: string; ref: string; date: string; time: string }>;
      message?: string;
    }>("/api/expert/availability", "PUT", {
      bands: rows.map(({ weekday, start, end }) => ({ weekday, start, end })),
    });
    setBusy(false);

    if (!result.ok) {
      setServerError(result.error);
      failed("Hours not saved", result.error);
      return;
    }

    setBaseline(serialise(rows));
    setSavedAt(stampNow());
    setConflicts(result.data.conflicts ?? []);
    saved("Weekly hours saved", result.data.message);
    router.refresh();
  };

  const total = weeklyHours(rows);

  return (
    <div className="p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="text-[0.86rem] leading-relaxed text-ink/70">
          Clients can only book inside these blocks, in {sessionMinutes}-minute sessions. Times are
          clinic time (IST).
        </p>
        <p className="text-[0.86rem] font-semibold text-forest-900 tabular-nums">
          {total} hour{total === 1 ? "" : "s"} a week
        </p>
      </div>

      {serverError && (
        <div className="mt-4">
          <InlineAlert tone="danger" title="We could not save that">
            <p>{serverError}</p>
          </InlineAlert>
        </div>
      )}

      {conflicts !== null && conflicts.length > 0 && (
        <div className="mt-4">
          <InlineAlert
            tone="warning"
            title={
              conflicts.length === 1
                ? "One booked session now sits outside your hours"
                : conflicts.length + " booked sessions now sit outside your hours"
            }
          >
            <p>
              Your hours are saved. These sessions were booked under the old grid and still stand —
              a client has paid for them. Honour them, or open each one to reschedule.
            </p>
            <ul className="mt-1 space-y-1">
              {conflicts.map((c) => (
                <li key={c.id}>
                  <Link href={"/expert/sessions/" + c.id} className="link-draw font-medium">
                    {relativeDay(c.date, today)} · {formatTime(c.time)} IST · {c.ref}
                  </Link>
                </li>
              ))}
            </ul>
          </InlineAlert>
        </div>
      )}

      {conflicts !== null && conflicts.length === 0 && (
        <div className="mt-4">
          <InlineAlert tone="success" title="Saved with no clashes">
            <p>Every session already on your calendar still falls inside your hours.</p>
          </InlineAlert>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {WEEKDAYS.map((day) => {
          const onDay = rows
            .filter((r) => r.weekday === day.index)
            .sort((a, b) => a.start.localeCompare(b.start));

          return (
            <fieldset
              key={day.index}
              className={cn(
                "rounded-xl border px-4 py-3.5 transition-colors",
                onDay.length > 0 ? "border-forest-800/12 bg-ivory" : "border-forest-800/10 bg-forest-800/[0.02]"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <legend className="text-[0.9rem] font-semibold text-forest-900">
                  {day.long}
                  {onDay.length === 0 && (
                    <span className="ml-2 text-[0.8rem] font-normal text-ink/45">not bookable</span>
                  )}
                </legend>
                <ActionButton tone="ghost" size="sm" onClick={() => addBand(day.index)}>
                  + Add block
                  <span className="sr-only"> to {day.long}</span>
                </ActionButton>
              </div>

              {onDay.length > 0 && (
                <ul className="mt-3 space-y-2.5">
                  {onDay.map((row) => {
                    const error = rowErrors.get(row.key);
                    return (
                      <li key={row.key}>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <label className="sr-only" htmlFor={row.key + "-start"}>
                            {day.long} block start
                          </label>
                          <Select
                            id={row.key + "-start"}
                            value={row.start}
                            invalid={Boolean(error)}
                            onChange={(e) => update(row.key, { start: e.target.value })}
                            className="w-[7.5rem]"
                          >
                            {SLOTS.map((t) => (
                              <option key={t} value={t}>
                                {formatTime(t)}
                              </option>
                            ))}
                          </Select>
                          <span aria-hidden="true" className="text-ink/45">
                            to
                          </span>
                          <label className="sr-only" htmlFor={row.key + "-end"}>
                            {day.long} block finish
                          </label>
                          <Select
                            id={row.key + "-end"}
                            value={row.end}
                            invalid={Boolean(error)}
                            onChange={(e) => update(row.key, { end: e.target.value })}
                            className="w-[7.5rem]"
                          >
                            {SLOTS.map((t) => (
                              <option key={t} value={t}>
                                {formatTime(t)}
                              </option>
                            ))}
                          </Select>
                          <span className="text-[0.8rem] text-ink/50 tabular-nums">
                            {Math.max(0, Math.round(((timeToMinutes(row.end) - timeToMinutes(row.start)) / sessionMinutes) * 10) / 10)}{" "}
                            slots
                          </span>
                          <button
                            type="button"
                            onClick={() => remove(row.key)}
                            className="ml-auto rounded-full px-3 py-1.5 text-[0.82rem] font-medium text-ink/55 transition-colors hover:bg-red-50 hover:text-red-700"
                          >
                            Remove
                            <span className="sr-only">
                              {" "}
                              {day.long} {formatTime(row.start)} to {formatTime(row.end)}
                            </span>
                          </button>
                        </div>
                        {error && (
                          <p className="mt-1.5 text-[0.8rem] font-medium text-red-700" role="alert">
                            {error}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </fieldset>
          );
        })}
      </div>

      {rows.some((r) => r.weekday === 1) && (
        <div className="mt-4">
          <ActionButton tone="secondary" size="sm" onClick={copyMondayToWeekdays}>
            Copy Monday to Tuesday–Friday
          </ActionButton>
        </div>
      )}

      {rows.length === 0 && (
        <div className="mt-4">
          <InlineAlert tone="warning" title="No bookable hours">
            <p>
              With an empty week you stay listed but unbookable, and new clients cannot reach you.
              Add at least one block, or set time off if you are away for a stretch.
            </p>
          </InlineAlert>
        </div>
      )}

      <SaveBar
        dirty={dirty}
        busy={busy}
        savedAt={savedAt}
        disabled={blocked}
        onSave={save}
        onReset={() => {
          setRows(toRows(initialBands));
          setBaseline(serialise(toRows(initialBands)));
          setConflicts(null);
          setServerError(null);
        }}
        saveLabel="Save weekly hours"
      />

      {blocked && (
        <p className="mt-2 text-right text-[0.82rem] font-medium text-red-700">
          Fix the highlighted blocks before saving.
        </p>
      )}

      <p className="mt-4 text-[0.8rem] text-ink/50">
        Changes apply to new bookings only, from {formatDate(today)}. Anything already booked keeps
        its slot.
      </p>
    </div>
  );
}
