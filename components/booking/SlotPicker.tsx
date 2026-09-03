"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { timeSlots } from "@/lib/experts";
import { HORIZON_DAYS, istDateOffset } from "@/lib/features/booking/policy";
import { cn } from "@/lib/utils";
import { Alert, EmptyState, Skeleton } from "@/components/ui/Feedback";

/**
 * Date and time selection, backed by real availability.
 *
 * What the calendar greys out is derived from the same column that enforces
 * booking, so the picker can't offer a time the server would then refuse. It
 * still refuses sometimes — someone else can take a slot in the seconds between
 * render and submit — which is why the parent can hand back a fresh set of
 * taken times and bump `refreshToken` to redraw.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export type SlotSelection = { date: string; time: string | null };

type Day = { iso: string; weekday: string; day: string; month: string };

function buildDays(): Day[] {
  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...opts }).format(
      // midday, so no formatting option can tip the date over a boundary
      new Date(`${iso}T12:00:00+05:30`)
    );

  return Array.from({ length: HORIZON_DAYS }, (_, i) => {
    const iso = istDateOffset(i + 1);
    return {
      iso,
      weekday: fmt(iso, { weekday: "short" }),
      day: fmt(iso, { day: "numeric" }),
      month: fmt(iso, { month: "short" }),
    };
  });
}

type Availability = { time: string; available: boolean }[];

export default function SlotPicker({
  expertId,
  value,
  onChange,
  refreshToken = 0,
  currentSlot,
  compact,
}: {
  expertId: string;
  value: SlotSelection;
  onChange: (next: SlotSelection) => void;
  /** Bump to force a re-fetch — e.g. after the server reported a taken slot. */
  refreshToken?: number;
  /** When moving an existing session, the time it currently occupies. */
  currentSlot?: { date: string; time: string };
  compact?: boolean;
}) {
  // built on the client so a statically-rendered page never ships a stale calendar
  const [days, setDays] = useState<Day[]>([]);
  useEffect(() => setDays(buildDays()), []);

  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [slots, setSlots] = useState<Availability>([]);

  const load = useCallback(
    async (date: string, signal?: AbortSignal) => {
      setState("loading");
      try {
        const res = await fetch(
          `/api/availability?expertId=${encodeURIComponent(expertId)}&date=${encodeURIComponent(date)}`,
          { signal, cache: "no-store" }
        );
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        setSlots(Array.isArray(data.slots) ? data.slots : []);
        setState("ready");
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setState("error");
      }
    },
    [expertId]
  );

  useEffect(() => {
    if (!value.date) return;
    const controller = new AbortController();
    load(value.date, controller.signal);
    return () => controller.abort();
  }, [value.date, load, refreshToken]);

  const openCount = useMemo(() => slots.filter((s) => s.available).length, [slots]);

  const pickDate = (iso: string) => {
    // changing the day always clears the time — the old one may not exist here
    onChange({ date: iso, time: null });
  };

  return (
    <div>
      {/* ---- dates ---- */}
      <div
        className="flex gap-2.5 overflow-x-auto pb-3 rail"
        role="radiogroup"
        aria-label="Choose a date"
      >
        {days.length === 0
          ? Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-[92px] w-[72px] shrink-0 rounded-2xl" />
            ))
          : days.map((d) => {
              const selected = value.date === d.iso;
              const isCurrent = currentSlot?.date === d.iso;
              return (
                <button
                  key={d.iso}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => pickDate(d.iso)}
                  className={cn(
                    "relative flex w-[72px] shrink-0 flex-col items-center rounded-2xl border py-4 transition-all duration-300 ease-silk",
                    selected
                      ? "border-forest-800 bg-forest-800 text-ivory shadow-bloom"
                      : "border-forest-800/15 bg-ivory-light text-ink/70 hover:border-forest-800/40"
                  )}
                >
                  <span className="text-[0.68rem] uppercase tracking-widest opacity-70">
                    {d.weekday}
                  </span>
                  <span className="mt-1 font-display text-2xl font-medium">{d.day}</span>
                  <span className="text-[0.68rem] uppercase tracking-widest opacity-70">
                    {d.month}
                  </span>
                  {isCurrent && (
                    <span
                      className="absolute -top-1.5 rounded-full bg-gold px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-forest-950"
                      aria-label="Your current session date"
                    >
                      now
                    </span>
                  )}
                </button>
              );
            })}
      </div>

      {/* ---- times ---- */}
      {!value.date ? (
        <p className={cn("text-sm text-ink/50", compact ? "mt-5" : "mt-7")}>
          Pick a day to see what&apos;s open.
        </p>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className={compact ? "mt-5" : "mt-7"}
        >
          {state === "loading" && (
            <div className="space-y-5" aria-busy="true">
              <span className="sr-only" role="status">
                Checking what&apos;s free on this day
              </span>
              {timeSlots.map((g) => (
                <div key={g.group}>
                  <Skeleton className="h-3 w-20" />
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {g.slots.map((s) => (
                      <Skeleton key={s} className="h-10 w-[84px] rounded-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {state === "error" && (
            <Alert
              tone="error"
              title="We couldn't load the times for that day."
              action={
                <button
                  type="button"
                  onClick={() => load(value.date)}
                  className="rounded-full bg-forest-800 px-5 py-2 text-[0.85rem] font-semibold text-ivory transition-colors hover:bg-forest-700"
                >
                  Try again
                </button>
              }
            >
              It&apos;s usually a passing connection problem — nothing you&apos;ve chosen has been lost.
            </Alert>
          )}

          {state === "ready" && openCount === 0 && (
            <EmptyState
              title="This day is fully booked."
              body="Every slot here is taken. Try the day before or after — most weeks have room within 48 hours."
            />
          )}

          {state === "ready" && openCount > 0 && (
            <div className="space-y-6">
              {timeSlots.map((group) => {
                const groupSlots = group.slots.map((time) => ({
                  time,
                  available: slots.find((s) => s.time === time)?.available ?? false,
                }));
                if (groupSlots.every((s) => !s.available) && compact) return null;

                return (
                  <div key={group.group}>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">
                      {group.group}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2.5">
                      {groupSlots.map(({ time, available }) => {
                        const isCurrent =
                          currentSlot?.date === value.date && currentSlot?.time === time;
                        const selected = value.time === time;
                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={!available && !isCurrent}
                            onClick={() => available && onChange({ date: value.date, time })}
                            aria-pressed={selected}
                            aria-label={
                              isCurrent
                                ? `${time} — your current session time`
                                : available
                                  ? `${time}`
                                  : `${time} — already booked`
                            }
                            className={cn(
                              "rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-300 ease-silk",
                              isCurrent && "border-gold/60 bg-gold/15 text-forest-800",
                              !available &&
                                !isCurrent &&
                                "cursor-not-allowed border-forest-800/10 text-ink/30 line-through",
                              available && selected && "border-gold bg-gold text-forest-950 shadow-lift",
                              available &&
                                !selected &&
                                !isCurrent &&
                                "border-forest-800/20 text-forest-800 hover:border-forest-800"
                            )}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <p className="text-[0.8rem] text-ink/45">
                {openCount} of {slots.length} times open · all times IST · 50-minute sessions
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
