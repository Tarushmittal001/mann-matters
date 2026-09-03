"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { Alert, CrisisLine, Spinner } from "@/components/ui/Feedback";
import SlotPicker, { type SlotSelection } from "@/components/booking/SlotPicker";
import PaymentPanel from "@/components/booking/PaymentPanel";
import { concerns, experts, type ConcernId, type Expert } from "@/lib/experts";
import { findConcern, specialisesIn } from "@/lib/matching";
import { changePolicyNote, HOLD_MINUTES } from "@/lib/features/booking/policy";
import { cn, formatINR } from "@/lib/utils";
import type { SerializedBooking } from "@/lib/features/booking/server";

const EASE = [0.22, 1, 0.36, 1] as const;
const STEPS = ["Concern", "Expert", "Date & time", "Review", "Payment"];

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

/**
 * `authenticated` is resolved on the server by the page, so the first paint is
 * already the right screen — either the flow or the sign-in gate.
 *
 * The gate comes first on purpose: someone's reason for seeking therapy is
 * health information, and we don't want it typed into a form that might then
 * bounce them to a login page. It is never parked in browser storage either.
 */
export default function BookingFlow({ authenticated }: { authenticated: boolean }) {
  /* --------------------------------------------------------------- state */
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const [concern, setConcern] = useState<ConcernId | null>(null);
  const [expert, setExpert] = useState<Expert | null>(null);
  const [slot, setSlot] = useState<SlotSelection>({ date: "", time: null });
  const [refreshToken, setRefreshToken] = useState(0);

  const [booking, setBooking] = useState<SerializedBooking | null>(null);
  const [holding, setHolding] = useState(false);
  const [holdError, setHoldError] = useState<string | null>(null);
  const [done, setDone] = useState<SerializedBooking | null>(null);

  const go = useCallback((next: number) => {
    setDir((d) => (next > step ? 1 : -1));
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  /** Best matches first, using the same vocabulary the /match tool speaks. */
  const sortedExperts = useMemo(() => {
    const keys = findConcern(concern)?.keys ?? [];
    if (!keys.length) return experts;
    return [...experts].sort((a, b) => {
      const diff = Number(specialisesIn(b, keys)) - Number(specialisesIn(a, keys));
      return diff !== 0 ? diff : b.rating - a.rating;
    });
  }, [concern]);

  const canContinue = [!!concern, !!expert, !!slot.date && !!slot.time, true, false][step];

  /* ------------------------------------------------------- hold the slot */
  const holdSlot = async () => {
    if (!concern || !expert || !slot.date || !slot.time) return;
    setHolding(true);
    setHoldError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concern,
          expertId: expert.id,
          date: slot.date,
          time: slot.time,
        }),
      });
      const data = await res.json();

      if (res.status === 401) {
        window.location.href = "/login?next=/book";
        return;
      }

      if (res.status === 409) {
        // someone else took it while we were on the review screen
        setHoldError(data.error);
        setSlot((s) => ({ date: s.date, time: null }));
        setRefreshToken((t) => t + 1);
        setHolding(false);
        go(2);
        return;
      }

      if (!res.ok) {
        setHoldError(data.error ?? "We couldn't hold that time. Please try again.");
        setHolding(false);
        return;
      }

      setBooking(data.booking);
      setHolding(false);
      go(4);
    } catch {
      setHoldError("We couldn't reach the server. Please check your connection and try again.");
      setHolding(false);
    }
  };

  const onHoldExpired = useCallback(() => {
    setBooking(null);
    setSlot((s) => ({ date: s.date, time: null }));
    setRefreshToken((t) => t + 1);
    setHoldError(
      `We could only hold that time for ${HOLD_MINUTES} minutes. Nothing was charged — please pick a time again.`
    );
    go(2);
  }, [go]);

  /* ----------------------------------------------------- gate: logged out */
  if (!authenticated) {
    return (
      <div className="page-top wrap pb-28">
        <p className="eyebrow mb-4 flex items-center gap-3">
          <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">
            मन
          </span>
          book a session
        </p>
        <h1 className="h-display max-w-2xl text-4xl md:text-5xl">
          First, a place to keep your sessions safe.
        </h1>
        <div className="mt-10 max-w-lg rounded-3xl border border-forest-800/10 bg-ivory-light p-8 shadow-bloom">
          <p className="leading-relaxed text-ink/70">
            Booking takes about two minutes. We ask you to log in before we ask anything about what
            you&apos;re going through — so what you tell us is attached to an account you control,
            and nothing sensitive is typed into a form you might get bounced out of.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button href="/signup?next=/book" variant="gold">
              Create an account
            </Button>
            <Button href="/login?next=/book" variant="outline">
              I already have one
            </Button>
          </div>
          <ul className="mt-8 space-y-2.5 border-t border-forest-800/10 pt-6 text-[0.88rem] text-ink/60">
            {[
              "Sessions are confidential — your therapist sees only what you choose to share.",
              `${changePolicyNote}`,
              "We never sell your data, and you can ask us to delete everything we hold.",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
        </div>
        <CrisisLine className="mt-10" />
      </div>
    );
  }

  /* --------------------------------------------------------- confirmation */
  if (done) {
    const paidWith =
      done.payment?.method === "card"
        ? `${done.payment.cardBrand ?? "Card"} •••• ${done.payment.last4 ?? "••••"}`
        : done.payment?.vpaMasked ?? "UPI";

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
          <span className="font-semibold text-forest-800">{done.expertName}</span> will see you on{" "}
          <span className="font-semibold text-forest-800">
            {new Intl.DateTimeFormat("en-IN", {
              timeZone: "Asia/Kolkata",
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date(`${done.date}T12:00:00+05:30`))}{" "}
            at {done.time} IST
          </span>
          . Your session link is on its way to your email.
        </p>

        <dl className="mx-auto mt-8 max-w-sm space-y-2.5 rounded-2xl border border-forest-800/10 bg-ivory-light p-6 text-left text-[0.9rem]">
          <div className="flex justify-between gap-4">
            <dt className="text-ink/55">Reference</dt>
            <dd className="font-mono font-semibold text-forest-800">{done.ref}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink/55">Paid</dt>
            <dd className="font-medium text-forest-900">{formatINR(done.amount)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink/55">Method</dt>
            <dd className="font-medium text-forest-900">{paidWith}</dd>
          </div>
        </dl>

        <p className="mt-6 text-sm text-ink/55">
          Find a quiet corner, keep earphones handy, and arrive as you are. That&apos;s all the
          preparation you need. {changePolicyNote}
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Button href="/dashboard" variant="forest">
            View my sessions
          </Button>
          <Button href="/" variant="outline">
            Back to home
          </Button>
        </div>

        <CrisisLine className="mt-12 justify-center" />
      </motion.div>
    );
  }

  /* ----------------------------------------------------------- the flow */
  const variants = {
    enter: (d: number) => ({ opacity: 0, x: 48 * d }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: -48 * d }),
  };

  const selectedConcern = concerns.find((c) => c.id === concern);

  return (
    <div className="page-top pb-28">
      <div className="wrap">
        <p className="eyebrow mb-4 flex items-center gap-3">
          <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">
            मन
          </span>
          book a session
        </p>
        <h1 className="h-display text-4xl md:text-5xl">Let&apos;s find your fifty minutes</h1>

        {/* progress */}
        <nav className="mt-10" aria-label="Booking progress">
          <ol className="flex gap-2 md:gap-3">
            {STEPS.map((label, i) => (
              <li key={label} className="flex-1">
                <button
                  type="button"
                  className="group w-full text-left disabled:cursor-default"
                  // once a slot is held, stepping back would strand the hold
                  onClick={() => i < step && !booking && go(i)}
                  disabled={i >= step || !!booking}
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
                      i < step && !booking && "group-hover:text-forest-700"
                    )}
                  >
                    {i + 1}. {label}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {holdError && (
          <Alert tone="warning" className="mt-8" title="Let's find you another time.">
            {holdError}
          </Alert>
        )}

        <div className="relative mt-12 min-h-[420px]">
          <AnimatePresence mode="wait" custom={dir}>
            {/* STEP 1 — concern */}
            {step === 0 && (
              <motion.div
                key="concern"
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: EASE }}
              >
                <h2 className="font-display text-2xl font-medium text-forest-900">
                  What&apos;s been on your mind?
                </h2>
                <p className="mt-2 max-w-xl text-ink/65">
                  This just helps us suggest the right experts. You can talk about anything once
                  you&apos;re in the room — and you can change this later.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {concerns.map((c) => (
                    <button
                      key={c.id}
                      type="button"
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
                      <span className="font-display text-xl font-medium text-forest-900">
                        {c.label}
                      </span>
                      <span className="mt-1.5 block text-sm leading-relaxed text-ink/60">
                        {c.hint}
                      </span>
                    </button>
                  ))}
                </div>
                <CrisisLine className="mt-10" />
              </motion.div>
            )}

            {/* STEP 2 — expert */}
            {step === 1 && (
              <motion.div
                key="expert"
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: EASE }}
              >
                <h2 className="font-display text-2xl font-medium text-forest-900">
                  Choose your expert
                </h2>
                <p className="mt-2 text-ink/65">
                  Every profile is a licensed, verified professional. Best matches for you are listed
                  first.
                </p>
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  {sortedExperts.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => {
                        setExpert(e);
                        setSlot({ date: "", time: null });
                      }}
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
                          <span className="font-display text-lg font-medium text-forest-900">
                            {e.name}
                          </span>
                          <Stars rating={e.rating} />
                        </span>
                        <span className="mt-0.5 block text-[0.82rem] text-ink/60">
                          {e.credentials} · {e.experience}
                        </span>
                        <span className="mt-2 flex flex-wrap gap-1.5">
                          {e.specialties.map((s) => (
                            <span
                              key={s}
                              className="rounded-full bg-sage-light/70 px-2.5 py-0.5 text-[0.72rem] font-medium text-forest-800"
                            >
                              {s}
                            </span>
                          ))}
                        </span>
                        <span className="mt-2.5 block text-[0.82rem] text-ink/60">
                          {e.languages.join(" · ")} ·{" "}
                          <span className="font-semibold text-forest-800">
                            {formatINR(e.price)}
                          </span>
                          /session
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3 — date & time */}
            {step === 2 && expert && (
              <motion.div
                key="schedule"
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: EASE }}
              >
                <h2 className="font-display text-2xl font-medium text-forest-900">
                  Pick a date and time
                </h2>
                <p className="mt-2 text-ink/65">
                  Live availability for {expert.name}. All times are IST. {changePolicyNote}
                </p>
                <div className="mt-8">
                  <SlotPicker
                    expertId={expert.id}
                    value={slot}
                    onChange={setSlot}
                    refreshToken={refreshToken}
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 4 — review */}
            {step === 3 && selectedConcern && expert && slot.date && slot.time && (
              <motion.div
                key="review"
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: EASE }}
              >
                <h2 className="font-display text-2xl font-medium text-forest-900">One last look</h2>
                <p className="mt-2 text-ink/65">
                  Check the details — then we&apos;ll hold this time for {HOLD_MINUTES} minutes while
                  you pay.
                </p>

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
                      <p className="font-display text-xl font-medium text-forest-900">
                        {expert.name}
                      </p>
                      <p className="text-sm text-ink/60">{expert.credentials}</p>
                    </div>
                  </div>

                  <dl className="mt-6 space-y-3.5 text-[0.95rem]">
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink/55">Concern</dt>
                      <dd className="font-medium text-forest-900">{selectedConcern.label}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink/55">Date</dt>
                      <dd className="font-medium text-forest-900">
                        {new Intl.DateTimeFormat("en-IN", {
                          timeZone: "Asia/Kolkata",
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        }).format(new Date(`${slot.date}T12:00:00+05:30`))}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink/55">Time</dt>
                      <dd className="font-medium text-forest-900">{slot.time} IST · 50 min</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-forest-800/10 pt-4">
                      <dt className="text-ink/55">Session fee</dt>
                      <dd className="font-display text-xl font-medium text-forest-900">
                        {formatINR(expert.price)}
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-5 text-[0.82rem] leading-relaxed text-ink/50">
                    {changePolicyNote} Cancel outside that window and you&apos;re refunded in full.
                  </p>

                  <div className="mt-7">
                    <Button onClick={holdSlot} variant="gold" className="w-full" disabled={holding}>
                      {holding ? <Spinner label="Holding your slot…" /> : "Hold this time & pay"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5 — payment */}
            {step === 4 && booking && (
              <motion.div
                key="payment"
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: EASE }}
              >
                <h2 className="font-display text-2xl font-medium text-forest-900">
                  Confirm your session
                </h2>
                <p className="mt-2 text-ink/65">
                  {booking.expertName} · {booking.time} IST ·{" "}
                  <span className="font-semibold text-forest-800">{formatINR(booking.amount)}</span>
                </p>

                <div className="mt-8 max-w-lg rounded-3xl border border-forest-800/10 bg-ivory-light p-8 shadow-bloom">
                  <PaymentPanel
                    booking={booking}
                    onPaid={(b) => setDone(b)}
                    onExpired={onHoldExpired}
                  />
                </div>

                <p className="mt-6 max-w-lg text-[0.82rem] text-ink/50">
                  Changed your mind?{" "}
                  <Link href="/dashboard" className="link-draw font-medium text-forest-800">
                    Leave this for now
                  </Link>{" "}
                  — the hold lapses on its own and nothing is charged.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* step controls */}
        {step < 3 && (
          <div className="mt-12 flex items-center justify-between">
            <button
              type="button"
              onClick={() => go(step - 1)}
              className={cn(
                "link-draw text-sm font-medium text-ink/60 hover:text-forest-900",
                step === 0 && "invisible"
              )}
            >
              ← Back
            </button>
            <Button onClick={() => canContinue && go(step + 1)} variant="forest" disabled={!canContinue}>
              Continue
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="mt-12">
            <button
              type="button"
              onClick={() => go(2)}
              className="link-draw text-sm font-medium text-ink/60 hover:text-forest-900"
            >
              ← Change the time
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
