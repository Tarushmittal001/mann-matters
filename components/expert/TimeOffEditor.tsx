"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDays, formatDate, formatTime, formatTimeRange, relativeDay } from "@/lib/clinic-time";
import { validateTimeOff, type TimeOffBlock } from "@/lib/expert-portal";
import {
  ActionButton,
  ConfirmDialog,
  Field,
  Select,
  TextInput,
  Toggle,
} from "@/components/expert/controls";
import { EmptyState, InlineAlert } from "@/components/expert/Panel";
import { send } from "@/components/expert/request";
import { useToast } from "@/components/expert/Toast";

type Block = TimeOffBlock & { id: string; reason: string };
type Conflict = { id: string; ref: string; date: string; time: string };

const HOURS = (() => {
  const out: string[] = [];
  for (let h = 5; h <= 23; h += 1) {
    out.push(String(h).padStart(2, "0") + ":00");
    if (h < 23) out.push(String(h).padStart(2, "0") + ":30");
  }
  return out;
})();

/**
 * Time off.
 *
 * Closing dates to *new* bookings is safe and instant. Closing dates that
 * already hold a paid session is not, so that case stops and asks: the clashing
 * sessions are named, and saving anyway is a separate, deliberate press that
 * leaves the practitioner holding a list to act on.
 */
export default function TimeOffEditor({
  blocks,
  today,
}: {
  blocks: Block[];
  today: string;
}) {
  const router = useRouter();
  const { saved, failed } = useToast();

  const [startDate, setStartDate] = useState(addDays(today, 1));
  const [endDate, setEndDate] = useState(addDays(today, 1));
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("13:00");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
  const [removing, setRemoving] = useState<Block | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  const draft: TimeOffBlock = {
    startDate,
    endDate,
    allDay,
    startTime: allDay ? null : startTime,
    endTime: allDay ? null : endTime,
  };

  const submit = async (acknowledge: boolean) => {
    const problem = validateTimeOff(draft, today);
    if (problem) {
      setError(problem);
      return;
    }

    setBusy(true);
    const result = await send<{ message?: string; conflicts?: Conflict[]; needsAcknowledgement?: boolean }>(
      "/api/expert/time-off",
      "POST",
      { ...draft, reason, acknowledge }
    );
    setBusy(false);

    if (!result.ok) {
      if (result.status === 409 && result.data?.needsAcknowledgement) {
        setConflicts(result.data.conflicts ?? []);
        return;
      }
      setError(result.error);
      failed("Time off not saved", result.error);
      return;
    }

    setConflicts(null);
    setError(null);
    setReason("");
    saved("Time off saved", result.data.message);
    router.refresh();
  };

  const remove = async (block: Block) => {
    setRemoveBusy(true);
    const result = await send<{ message?: string }>("/api/expert/time-off/" + block.id, "DELETE");
    setRemoveBusy(false);
    setRemoving(null);
    if (!result.ok) {
      failed("Not removed", result.error);
      return;
    }
    saved("Time off removed", result.data.message);
    router.refresh();
  };

  const describe = (b: Block) =>
    b.startDate === b.endDate
      ? formatDate(b.startDate)
      : formatDate(b.startDate) + " → " + formatDate(b.endDate);

  return (
    <div className="p-5 sm:p-6">
      {/* ── what is already booked off ──────────────────────────────────── */}
      {blocks.length === 0 ? (
        <EmptyState
          icon="clock"
          title="No time off booked"
          body="Nothing is blocked out, so your weekly hours apply as they are. Add a block for leave, a conference, or an afternoon you need back."
        />
      ) : (
        <ul className="space-y-3">
          {blocks.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 rounded-xl border border-forest-800/12 bg-ivory px-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="text-[0.92rem] font-semibold text-forest-900">{describe(b)}</p>
                <p className="mt-0.5 text-[0.84rem] text-ink/65">
                  {b.allDay
                    ? "All day"
                    : formatTimeRange(b.startTime ?? "00:00", b.endTime ?? "23:59")}
                  {b.startDate <= today && today <= b.endDate && (
                    <span className="ml-2 rounded-full bg-neel/[0.08] px-2 py-0.5 text-[0.74rem] font-semibold text-neel-ink">
                      Active now
                    </span>
                  )}
                </p>
                {b.reason && (
                  <p className="mt-1 text-[0.82rem] text-ink/55">
                    {b.reason}
                    <span className="ml-2 text-ink/40">private to you and our team</span>
                  </p>
                )}
              </div>
              <ActionButton tone="ghost" size="sm" onClick={() => setRemoving(b)}>
                Remove
                <span className="sr-only"> time off on {describe(b)}</span>
              </ActionButton>
            </li>
          ))}
        </ul>
      )}

      {/* ── add a block ─────────────────────────────────────────────────── */}
      <div className="mt-7 border-t border-forest-800/10 pt-6">
        <h3 className="font-display text-lg font-medium text-forest-900">Add time off</h3>
        <p className="mt-1 text-[0.85rem] text-ink/65">
          Dates are clinic time (IST). New bookings close immediately; sessions already booked are
          never cancelled for you.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="First day away" required>
            {({ id }) => (
              <TextInput
                id={id}
                type="date"
                min={today}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                  setError(null);
                }}
              />
            )}
          </Field>

          <Field label="Last day away" required hint="Same date for a single day.">
            {({ id, describedBy }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                type="date"
                min={startDate}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setError(null);
                }}
              />
            )}
          </Field>
        </div>

        <div className="mt-1 border-y border-forest-800/10">
          <Toggle
            checked={allDay}
            onChange={(next) => {
              setAllDay(next);
              setError(null);
              if (!next && startDate !== endDate) setEndDate(startDate);
            }}
            label="All day"
            hint="Turn this off to block only part of a single day, such as a clinic afternoon."
          />
        </div>

        {!allDay && (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="From" required>
              {({ id }) => (
                <Select id={id} value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                  {HOURS.map((t) => (
                    <option key={t} value={t}>
                      {formatTime(t)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Until" required>
              {({ id }) => (
                <Select id={id} value={endTime} onChange={(e) => setEndTime(e.target.value)}>
                  {HOURS.map((t) => (
                    <option key={t} value={t}>
                      {formatTime(t)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        )}

        <div className="mt-5">
          <Field
            label="Reason"
            hint="For you and our operations team only. Clients are never shown this — they simply see no free slots."
            counter={reason.length + " / 160"}
          >
            {({ id, describedBy }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                maxLength={160}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Family wedding"
              />
            )}
          </Field>
        </div>

        {error && (
          <div className="mt-4">
            <InlineAlert tone="danger" title="Check those dates">
              <p>{error}</p>
            </InlineAlert>
          </div>
        )}

        <div className="mt-5">
          <ActionButton onClick={() => submit(false)} busy={busy}>
            Block these dates
          </ActionButton>
        </div>
      </div>

      {/* ── clash: named, then a deliberate second press ─────────────────── */}
      <ConfirmDialog
        open={conflicts !== null}
        title={
          conflicts && conflicts.length === 1
            ? "One booked session is inside those dates"
            : (conflicts?.length ?? 0) + " booked sessions are inside those dates"
        }
        body={
          <>
            <p>
              Blocking these dates does not cancel a session someone has already paid for. If you
              save now, the block goes in and these sessions stay on your calendar for you to
              reschedule or cancel one by one.
            </p>
            <ul className="space-y-1 font-medium text-forest-900">
              {(conflicts ?? []).map((c) => (
                <li key={c.id}>
                  <Link href={"/expert/sessions/" + c.id} className="link-draw">
                    {relativeDay(c.date, today)} · {formatTime(c.time)} IST · {c.ref}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        }
        confirmLabel="Save the block anyway"
        cancelLabel="Pick other dates"
        tone="primary"
        busy={busy}
        onCancel={() => setConflicts(null)}
        onConfirm={() => submit(true)}
      />

      <ConfirmDialog
        open={removing !== null}
        title="Remove this time off?"
        body={
          <p>
            {removing ? describe(removing) : ""} reopens for booking straight away, inside your
            usual weekly hours.
          </p>
        }
        confirmLabel="Remove it"
        busy={removeBusy}
        onCancel={() => setRemoving(null)}
        onConfirm={() => removing && remove(removing)}
      />
    </div>
  );
}
