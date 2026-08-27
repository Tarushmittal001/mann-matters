"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { concerns, experts, timeSlots, type ConcernId, type Expert } from "@/lib/experts";
import { cn, formatINR, todayISO } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
const STEPS = ["Concern", "Expert", "Date & time", "Confirm"];

type Day = { iso: string; weekday: string; day: number; month: string };

function buildDays(): Day[] {
  const fmtW = new Intl.DateTimeFormat("en-IN", { weekday: "short" });
  const fmtM = new Intl.DateTimeFormat("en-IN", { month: "short" });
  const today = new Date(`${todayISO()}T00:00:00Z`);
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + 1 + i);
    return {
      iso: d.toISOString().slice(0, 10),
      weekday: fmtW.format(d),
      day: d.getDate(),
      month: fmtM.format(d),
    };
  });
}

// deterministic "fully booked" pattern so the UI feels real
function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-gold" aria-label={`Rated ${rating} out of 5`}>
      <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 1.5 12.6 7l6 .7-4.5 4.1 1.2 5.9L10 14.8 4.7 17.7 5.9 11.8 1.4 7.7l6-.7L10 1.5Z" />
      </svg>
      <span className="text-sm font-semibold text-forest-800">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function BookingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [concern, setConcern] = useState<ConcernId | null>(null);
  const [expert, setExpert] = useState<Expert | null>(null);
  const [date, setDate] = useState<Day | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [bookingRef, setBookingRef] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // dates are generated on the client so the static page never goes stale
  useEffect(() => setDays(buildDays()), []);

  useEffect(() => {
    if (!expert || !date) {
      setAvailableSlots([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/bookings?expertId=${encodeURIComponent(expert.id)}&date=${date.iso}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("availability"))))
      .then((data: { available?: string[] }) => {
        if (!cancelled) {
          setAvailableSlots(data.available ?? []);
          setTime((current) => (current && data.available?.includes(current) ? current : null));
        }
      })
      .catch(() => {
        if (!cancelled) setAvailableSlots(timeSlots.flatMap((group) => group.slots));
      });
    return () => {
      cancelled = true;
    };
  }, [expert, date]);

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0 });
  };

  const canContinue = [!!concern, !!expert, !!date && !!time, true][step];

  const sortedExperts = useMemo(() => {
    if (!concern) return experts;
    const match = (e: Expert) =>
      e.specialties.some((s) => s.toLowerCase().includes(concern === "career" ? "career" : concern));
    return [...experts].sort((a, b) => Number(match(b)) - Number(match(a)));
  }, [concern]);

  const onConfirm = async () => {
    if (!concern || !expert || !date || !time) return;
    setStatus("submitting");
    setSubmitError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concern, expertId: expert.id, date: date.iso, time }),
      });
      if (res.status === 401) {
        router.push("/login?next=/book");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
        setStatus("idle");
        return;
      }
      setBookingRef(data.ref);
      setStatus("done");
    } catch {
      setSubmitError("Couldn't reach the server. Please try again.");
      setStatus("idle");
    }
  };

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: 48 * d }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: -48 * d }),
  };

  /* ---------- success state ---------- */
  if (status === "done" && expert && date && time) {
    return (
      <motion.div
        className="page-top mx-auto max-w-xl pb-28 text-center"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <motion.div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-forest-800"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 16 }}
        >
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
            <motion.path
              d="M8 17.5 14.5 24 26 11"
              stroke="#C8A45D"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.45, duration: 0.5, ease: EASE }}
            />
          </svg>
        </motion.div>
        <h1 className="h-display mt-8 text-4xl md:text-5xl">You&apos;re booked.</h1>
        <p className="mt-5 leading-relaxed text-ink/70">
          <span className="font-semibold text-forest-800">{expert.name}</span> will see you on{" "}
          <span className="font-semibold text-forest-800">
            {date.weekday}, {date.day} {date.month} at {time}
          </span>
          . Your session link is on its way to your WhatsApp and email. Booking
          reference: <span className="font-mono text-sm font-semibold text-forest-800">{bookingRef}</span>
        </p>
        <p className="mt-4 text-sm text-ink/55">
          Find a quiet corner, keep earphones handy, and arrive as you are. That&apos;s all the preparation you need.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Button href="/dashboard" variant="forest">
            View my sessions
          </Button>
          <Button href="/" variant="outline">
            Back to home
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="page-top pb-28">
      <div className="wrap">
        <p className="eyebrow mb-4 flex items-center gap-3">
          <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
          book a session
        </p>
        <h1 className="h-display text-4xl md:text-5xl">Let&apos;s find your fifty minutes</h1>

        {/* progress */}
        <nav className="mt-10" aria-label="Booking progress">
          <ol className="flex gap-2 md:gap-3">
            {STEPS.map((label, i) => (
              <li key={label} className="flex-1">
                <button
                  className="group w-full text-left"
                  onClick={() => i < step && go(i)}
                  disabled={i >= step}
                  aria-current={i === step ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "block h-[3px] rounded-full transition-colors duration-500",
                      i <= step ? "bg-gold" : "bg-forest-800/15"
                    )}
                  />
                  <span
                    className={cn(
                      "mt-2 block text-[0.7rem] font-semibold uppercase tracking-[0.14em] md:text-xs",
                      i === step ? "text-forest-900" : "text-ink/45",
                      i < step && "group-hover:text-forest-700"
                    )}
                  >
                    {i + 1}. {label}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="relative mt-12 min-h-[420px]">
          <AnimatePresence mode="wait" custom={dir}>
            {/* STEP 1 — concern */}
            {step === 0 && (
              <motion.div key="concern" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.45, ease: EASE }}>
                <h2 className="font-display text-2xl font-medium text-forest-900">
                  What&apos;s been on your mind?
                </h2>
                <p className="mt-2 text-ink/65">
                  This just helps us suggest the right experts. You can talk about anything once you&apos;re in the room.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {concerns.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setConcern(c.id);
                        setTimeout(() => go(1), 260);
                      }}
                      className={cn(
                        "card-lift rounded-2xl border bg-ivory-light p-6 text-left",
                        concern === c.id
                          ? "border-gold shadow-bloom ring-1 ring-gold"
                          : "border-forest-800/10 shadow-lift"
                      )}
                      aria-pressed={concern === c.id}
                    >
                      <span className="font-display text-xl font-medium text-forest-900">{c.label}</span>
                      <span className="mt-1.5 block text-sm leading-relaxed text-ink/60">{c.hint}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2 — expert */}
            {step === 1 && (
              <motion.div key="expert" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.45, ease: EASE }}>
                <h2 className="font-display text-2xl font-medium text-forest-900">Choose your expert</h2>
                <p className="mt-2 text-ink/65">
                  Every profile is a licensed, verified professional. Best matches for you are listed first.
                </p>
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  {sortedExperts.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setExpert(e)}
                      className={cn(
                        "card-lift flex gap-5 rounded-2xl border bg-ivory-light p-5 text-left",
                        expert?.id === e.id
                          ? "border-gold shadow-bloom ring-1 ring-gold"
                          : "border-forest-800/10 shadow-lift"
                      )}
                      aria-pressed={expert?.id === e.id}
                    >
                      <Image
                        src={e.photo}
                        alt={`Portrait of ${e.name}`}
                        width={150}
                        height={150}
                        className="h-[88px] w-[88px] shrink-0 rounded-xl object-cover"
                      />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center justify-between gap-x-3">
                          <span className="font-display text-lg font-medium text-forest-900">{e.name}</span>
                          <Stars rating={e.rating} />
                        </span>
                        <span className="mt-0.5 block text-[0.82rem] text-ink/60">
                          {e.credentials} · {e.experience}
                        </span>
                        <span className="mt-2 flex flex-wrap gap-1.5">
                          {e.specialties.map((s) => (
                            <span key={s} className="rounded-full bg-sage-light/70 px-2.5 py-0.5 text-[0.72rem] font-medium text-forest-800">
                              {s}
                            </span>
                          ))}
                        </span>
                        <span className="mt-2.5 block text-[0.82rem] text-ink/60">
                          {e.languages.join(" · ")} ·{" "}
                          <span className="font-semibold text-forest-800">{formatINR(e.price)}</span>/session
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3 — date & time */}
            {step === 2 && (
              <motion.div key="schedule" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.45, ease: EASE }}>
                <h2 className="font-display text-2xl font-medium text-forest-900">Pick a date and time</h2>
                <p className="mt-2 text-ink/65">All times are IST. Rescheduling is free up to 24 hours before.</p>

                <div className="mt-8 flex gap-2.5 overflow-x-auto pb-3" role="listbox" aria-label="Choose a date">
                  {days.map((d) => (
                    <button
                      key={d.iso}
                      role="option"
                      aria-selected={date?.iso === d.iso}
                      onClick={() => {
                        setDate(d);
                        setTime(null);
                      }}
                      className={cn(
                        "flex w-[72px] shrink-0 flex-col items-center rounded-2xl border py-4 transition-all duration-300 ease-silk",
                        date?.iso === d.iso
                          ? "border-forest-800 bg-forest-800 text-ivory shadow-bloom"
                          : "border-forest-800/15 bg-ivory-light text-ink/70 hover:border-forest-800/40"
                      )}
                    >
                      <span className="text-[0.68rem] uppercase tracking-widest opacity-70">{d.weekday}</span>
                      <span className="mt-1 font-display text-2xl font-medium">{d.day}</span>
                      <span className="text-[0.68rem] uppercase tracking-widest opacity-70">{d.month}</span>
                    </button>
                  ))}
                </div>

                {date && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="mt-7 space-y-6">
                    {timeSlots.map((g) => (
                      <div key={g.group}>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">{g.group}</p>
                        <div className="mt-3 flex flex-wrap gap-2.5">
                          {g.slots.map((slot) => {
                            const taken = !availableSlots.includes(slot);
                            return (
                              <button
                                key={slot}
                                disabled={taken}
                                onClick={() => setTime(slot)}
                                className={cn(
                                  "rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-300 ease-silk",
                                  taken && "cursor-not-allowed border-forest-800/10 text-ink/30 line-through",
                                  !taken && time === slot
                                    ? "border-gold bg-gold text-forest-950 shadow-lift"
                                    : !taken && "border-forest-800/20 text-forest-800 hover:border-forest-800"
                                )}
                                aria-pressed={time === slot}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 4 — confirm */}
            {step === 3 && concern && expert && date && time && (
              <motion.div key="confirm" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.45, ease: EASE }}>
                <h2 className="font-display text-2xl font-medium text-forest-900">One last look</h2>
                <p className="mt-2 text-ink/65">Check the details — then we&apos;ll hold this time just for you.</p>

                <div className="mt-8 max-w-lg rounded-3xl border border-forest-800/10 bg-ivory-light p-8 shadow-bloom">
                  <div className="flex items-center gap-5 border-b border-forest-800/10 pb-6">
                    <Image
                      src={expert.photo}
                      alt={`Portrait of ${expert.name}`}
                      width={150}
                      height={150}
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-display text-xl font-medium text-forest-900">{expert.name}</p>
                      <p className="text-sm text-ink/60">{expert.credentials}</p>
                    </div>
                  </div>
                  <dl className="mt-6 space-y-3.5 text-[0.95rem]">
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink/55">Concern</dt>
                      <dd className="font-medium text-forest-900">{concerns.find((c) => c.id === concern)?.label}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink/55">Date</dt>
                      <dd className="font-medium text-forest-900">
                        {date.weekday}, {date.day} {date.month}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink/55">Time</dt>
                      <dd className="font-medium text-forest-900">{time} IST · 50 min</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-forest-800/10 pt-4">
                      <dt className="text-ink/55">Session fee</dt>
                      <dd className="font-display text-xl font-medium text-forest-900">{formatINR(expert.price)}</dd>
                    </div>
                  </dl>
                  <p className="mt-5 text-[0.82rem] leading-relaxed text-ink/50">
                    Pay after the session is confirmed — UPI, card, or netbanking. Cancel or reschedule free up to 24 hours before.
                  </p>
                  {submitError && (
                    <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                      {submitError}
                    </p>
                  )}
                  <div className="mt-7">
                    <Button onClick={onConfirm} variant="gold" className="w-full" disabled={status === "submitting"}>
                      {status === "submitting" ? "Holding your slot…" : "Confirm booking"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* step controls */}
        <div className="mt-12 flex items-center justify-between">
          <button
            onClick={() => go(step - 1)}
            className={cn("link-draw text-sm font-medium text-ink/60 hover:text-forest-900", step === 0 && "invisible")}
          >
            ← Back
          </button>
          {step < 3 && (
            <Button onClick={() => canContinue && go(step + 1)} variant="forest" disabled={!canContinue}>
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
