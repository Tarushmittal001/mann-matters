"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { Alert, CrisisLine, Spinner } from "@/components/ui/Feedback";
import SlotPicker, { type SlotSelection } from "@/components/booking/SlotPicker";
import PaymentPanel from "@/components/booking/PaymentPanel";
import type { Expert } from "@/lib/experts";
import { findConcern, specialisesIn } from "@/lib/matching";
import { changePolicyNote, HOLD_MINUTES } from "@/lib/features/booking/policy";
import CodeBox from "@/components/booking/CodeBox";
import GuardianConsent, {
  EMPTY_GUARDIAN,
  guardianReady,
  type Guardian,
} from "@/components/booking/GuardianConsent";
import type { Discount } from "@/lib/coupons";
import {
  concernForService,
  priceForExpertService,
  priceRangeForService,
  services,
  type Service,
} from "@/lib/services";
import { useCopy } from "@/lib/i18n/client";
import { SERVICES_HI } from "@/lib/i18n/services-hi";
import { cn, formatINR } from "@/lib/utils";
import Price from "@/components/ui/Price";
import { standardPrice } from "@/lib/pricing";
import type { SerializedBooking } from "@/lib/features/booking/server";

const EASE = [0.22, 1, 0.36, 1] as const;

/** A service in the reader's language: the Hindi catalogue has its own wording. */
function local(service: Service, locale: string) {
  const hi = locale === "hi" ? SERVICES_HI[service.slug] : null;
  return {
    title: hi?.title ?? service.title,
    summary: hi?.summary ?? service.summary,
    duration: hi?.duration ?? service.duration,
  };
}
const localDuration = (service: Service, locale: string) => local(service, locale).duration;

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
export default function BookingFlow({
  authenticated,
  /** The catalogue, read from the database by the page that renders this. */
  experts,
  /** Pre-chosen from a "Book with …" link — the self-check suggests
   *  therapists, and arriving here should not make you find them again. */
  initialExpert,
  /** Arrived from a service card, so the first step is already answered. */
  initialService = null,
  /** Arrived from the "Consult now" bar, asking for the free first session. */
  freeIntent = false,
  /** What the server decided about that free session; null when not asked. */
  proBono = null,
  initialCode = "",
  minor = false,
  guardianOnFile = false,
}: {
  authenticated: boolean;
  experts: Expert[];
  initialExpert?: Expert | null;
  /** Arrived from a service card, so the first step is already answered. */
  initialService?: Service | null;
  freeIntent?: boolean;
  proBono?: "eligible" | "needs-phone" | "used" | null;
  /** A code from a shared link, offered in the box rather than applied. */
  initialCode?: string;
  /** The account says they are under 18. */
  minor?: boolean;
  /** A guardian has already been named and has already agreed. */
  guardianOnFile?: boolean;
}) {
  // the language is read off the URL, so the same flow is correct in both
  const { t, path, locale } = useCopy();
  const STEPS = t.booking.steps;

  /* --------------------------------------------------------------- state */
  /*
   * Start on the first question that has not already been answered.
   *
   * A service card answers step one, so those arrivals begin at the therapist.
   * The matcher and the self-check answer BOTH — they send service *and*
   * therapist — and those arrivals used to land on "choose your expert" with
   * the expert already chosen, which is the same redundant step a service card
   * used to cause. "Back" still walks to the earlier choices if someone wants
   * to change their mind; nothing is skipped past, only pre-answered.
   *
   * The therapist only counts as answered if they are cleared for the service
   * that came with them, which is the rule `expert` below applies and the
   * server enforces again.
   */
  const bothChosen =
    !!initialService &&
    !!initialExpert &&
    initialExpert.services.includes(initialService.slug);
  const [step, setStep] = useState(bothChosen ? 2 : initialService ? 1 : 0);
  const [dir, setDir] = useState(1);

  // The service is now the first choice and the one that sets the price. The
  // concern is derived from it on the server — six concerns could never stand
  // in for fourteen services, and asking for both was the redundant step.
  const [service, setService] = useState<Service | null>(
    initialService ??
      // a therapist who takes exactly one kind of session needs no choosing
      (initialExpert && initialExpert.services.length === 1
        ? services.find((s) => s.slug === initialExpert.services[0]) ?? null
        : null)
  );
  // Arrived with a therapist but no service: show only what they take, until
  // the person asks to see everything.
  const [showAllServices, setShowAllServices] = useState(false);
  // A therapist from a link only stands if they are cleared for the service
  // that came with it — the same rule the server enforces.
  const [expert, setExpert] = useState<Expert | null>(
    initialExpert && (!initialService || initialExpert.services.includes(initialService.slug))
      ? initialExpert
      : null
  );
  // where sign-in should return to — carrying the pre-chosen therapist, so
  // logging in does not quietly drop the choice that brought you here
  const gateNext = (() => {
    const q = new URLSearchParams();
    if (initialExpert) q.set("expert", initialExpert.id);
    // and the free-session ask, so signing in doesn't quietly drop that either
    if (freeIntent) q.set("free", "1");
    if (initialCode) q.set("ref", initialCode);
    // and the service they picked on a card — the one that sets the price
    if (initialService) q.set("service", initialService.slug);
    const qs = q.toString();
    return qs ? `/book?${qs}` : "/book";
  })();
  // the server said yes; the server checks again when the booking is made
  const free = proBono === "eligible";
  const [slot, setSlot] = useState<SlotSelection>({ date: "", time: null });
  const [refreshToken, setRefreshToken] = useState(0);

  // priced by the server on the review screen, priced again when the booking
  // is made — this copy only decides what the screen says
  const [discount, setDiscount] = useState<Discount | null>(null);
  const needsGuardian = minor && !guardianOnFile;
  const [guardian, setGuardian] = useState<Guardian>(EMPTY_GUARDIAN);
  const [guardianErrors, setGuardianErrors] = useState<Record<string, string>>({});
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

  /**
   * Who can actually take this session, best matches first.
   *
   * Filtered, not merely sorted: a practitioner who is not qualified for the
   * service is not an option, and the server refuses the booking anyway. The
   * old code ranked all six for every concern, which is how somebody could
   * book a psychologist for a psychiatry consultation.
   */
  const sortedExperts = useMemo(() => {
    if (!service) return [];
    const offering = experts.filter((e) => e.services.includes(service.slug));
    const keys = findConcern(concernForService(service.slug))?.keys ?? [];
    if (!keys.length) return offering;
    return [...offering].sort((a, b) => {
      const diff = Number(specialisesIn(b, keys)) - Number(specialisesIn(a, keys));
      return diff !== 0 ? diff : b.rating - a.rating;
    });
  }, [service, experts]);

  /**
   * What this session costs: this practitioner's rate for this service.
   *
   * Before a therapist is chosen there is no single number to show, because
   * two of them may charge differently for the same service — so the picker
   * shows each one's own price and this stays null until the pair is settled.
   * The server prices it again on submit; this is only what the person is
   * shown, and the two must agree.
   */
  const price = useMemo(
    () => (service && expert ? priceForExpertService(expert, service.slug) : null),
    [service, expert]
  );

  /** The spread for a service across the practitioners still in play. */
  const rangeFor = (slug: string) => priceRangeForService(slug, sortedExperts);

  /**
   * The services somebody on this catalogue can actually take.
   *
   * Derived from the practitioners the page handed us, so a service nobody is
   * qualified for never reaches the picker. It is better to not offer a
   * psychiatry slot than to offer one and staff it with a psychologist.
   */
  const bookableServices = useMemo(
    () => services.filter((sv) => experts.some((e) => e.services.includes(sv.slug))),
    [experts]
  );

  /** The therapist the picker is narrowed to, while it still is. */
  const narrowTo =
    !showAllServices && initialExpert && expert?.id === initialExpert.id ? expert : null;
  const pickerServices = narrowTo
    ? bookableServices.filter((sv) => narrowTo.services.includes(sv.slug))
    : bookableServices;

  const canContinue = [!!service, !!expert, !!slot.date && !!slot.time, true, false][step];

  /* ------------------------------------------------------- hold the slot */
  const holdSlot = async () => {
    if (!service || !expert || !slot.date || !slot.time) return;

    // checked here so the message lands beside the field, and checked again on
    // the server, which is the one that actually decides
    if (needsGuardian && !guardianReady(guardian)) {
      setGuardianErrors({
        guardianName: guardian.name.trim() ? "" : "We need their name.",
        guardianPhone: guardian.phone.trim() ? "" : "We need a number we can reach them on.",
        guardianConsent: guardian.consent ? "" : "We can't book without this.",
      });
      return;
    }
    setGuardianErrors({});

    setHolding(true);
    setHoldError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: service.slug,
          expertId: expert.id,
          date: slot.date,
          time: slot.time,
          ...(free ? { proBono: true } : {}),
          ...(discount && !free ? { code: discount.code } : {}),
          ...(needsGuardian
            ? {
                guardian: {
                  name: guardian.name,
                  phone: guardian.phone,
                  consent: guardian.consent,
                },
              }
            : {}),
        }),
      });
      const data = await res.json();

      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(gateNext)}`;
        return;
      }

      // Guardian errors go beside the guardian fields. They are picked out by
      // name, because this branch used to take *every* field error — and for
      // anyone not shown the guardian block, a refusal rendered nowhere and the
      // button simply looked dead.
      const fieldErrors: Record<string, string> = data.fields ?? {};
      const guardianOnly = Object.keys(fieldErrors).filter((k) => k.startsWith("guardian"));
      if (res.status === 422 && guardianOnly.length && needsGuardian) {
        setGuardianErrors(fieldErrors);
        setHolding(false);
        return;
      }

      // Anything else the server refused — no service chosen, a therapist not
      // cleared for it — is said out loud above the flow, with the server's
      // own words, so the person always learns why nothing happened.
      if (res.status === 422 && !fieldErrors.code) {
        const said = Object.values(fieldErrors).filter(Boolean)[0];
        setHoldError(said ?? data.error ?? "Something on this page needs another look. Please check it and try again.");
        setHolding(false);
        if (fieldErrors.service) go(0);
        return;
      }

      if (res.status === 422 && data.fields?.code) {
        // it lapsed, or was used up, between the review screen and this request
        setDiscount(null);
        setHoldError(data.fields.code);
        setHolding(false);
        return;
      }

      if (data.code === "PHONE_REQUIRED" || data.code === "PRO_BONO_USED") {
        setHoldError(data.error);
        setHolding(false);
        return;
      }

      // Not a slot problem: this therapist isn't cleared for this session (an
      // admin changed it while the page was open). Back to choosing a person.
      if (res.status === 409 && data.code === "SERVICE_NOT_OFFERED") {
        setHoldError(data.error);
        setExpert(null);
        setSlot({ date: "", time: null });
        setHolding(false);
        go(1);
        return;
      }
      if (res.status === 409 && data.code === "NO_PRICE") {
        setHoldError(data.error);
        setHolding(false);
        go(0);
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

      if (data.booking?.proBono) {
        setHolding(false);
        setDone(data.booking);
        window.scrollTo({ top: 0, behavior: "smooth" });
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
          {t.booking.eyebrow}
        </p>
        <h1 className="h-display max-w-2xl text-4xl md:text-5xl">{t.booking.gateTitle}</h1>
        <div className="mt-10 max-w-lg rounded-3xl border border-forest-800/10 bg-ivory-light p-8 shadow-bloom">
          <p className="leading-relaxed text-ink/70">{t.booking.gateBody}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button href={`${path("/signup")}?next=${encodeURIComponent(gateNext)}`} variant="gold">
              {t.booking.createAccount}
            </Button>
            <Button href={`${path("/login")}?next=${encodeURIComponent(gateNext)}`} variant="outline">
              {t.booking.signIn}
            </Button>
          </div>
          <ul className="mt-8 space-y-2.5 border-t border-forest-800/10 pt-6 text-[0.88rem] text-ink/70">
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
            <dt className="text-ink/70">Reference</dt>
            <dd className="font-mono font-semibold text-forest-800">{done.ref}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink/70">{done.proBono ? "Fee" : "Paid"}</dt>
            <dd className="font-medium text-forest-900">
              {done.proBono ? "Free first session" : formatINR(done.amount)}
            </dd>
          </div>
          {!done.proBono && (
            <div className="flex justify-between gap-4">
              <dt className="text-ink/70">Method</dt>
              <dd className="font-medium text-forest-900">{paidWith}</dd>
            </div>
          )}
        </dl>

        <p className="mt-6 text-sm text-ink/70">
          Find a quiet corner, keep earphones handy, and arrive as you are. That&apos;s all the
          preparation you need. {changePolicyNote}
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Button href="/dashboard" variant="forest">
            View my sessions
          </Button>
          {/* Opens the receipt with the save dialog already up. A new tab, so
              this confirmation — the only place the reference is shown large —
              is still here when they come back. */}
          <Button href={`/receipt/${done.id}?download=1`} external variant="outline">
            Download receipt
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


  return (
    <div className="page-top pb-28">
      <div className="wrap">
        <p className="eyebrow mb-4 flex items-center gap-3">
          <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">
            मन
          </span>
          book a session
        </p>
        <h1 className="h-display text-4xl md:text-5xl">
          {service
            ? t.booking.headlineFor.replace("{duration}", localDuration(service, locale))
            : t.booking.headline}
        </h1>

        {freeIntent && proBono === "eligible" && (
          <div className="mt-6 max-w-2xl rounded-2xl border-l-2 border-gold bg-gold/10 px-5 py-4 text-[0.93rem] leading-relaxed text-forest-900">
            <strong className="font-semibold">Your first session is free.</strong> Choose what&apos;s
            on your mind, a therapist and a time — there&apos;s no payment step. One free session per
            verified phone number.
          </div>
        )}
        {freeIntent && proBono === "needs-phone" && (
          <div className="mt-6 max-w-2xl rounded-2xl border-l-2 border-gold bg-gold/10 px-5 py-4 text-[0.93rem] leading-relaxed text-forest-900">
            <strong className="font-semibold">Your first session is free once your phone is verified.</strong>{" "}
            That&apos;s how we keep it to one per person.{" "}
            <Link href="/dashboard/profile" className="font-semibold underline underline-offset-2">
              Verify your phone
            </Link>
            , then come back to this page. You can also carry on below as a regular session.
          </div>
        )}
        {freeIntent && proBono === "used" && (
          <div className="mt-6 max-w-2xl rounded-2xl border-l-2 border-forest-800/30 bg-forest-800/[0.04] px-5 py-4 text-[0.93rem] leading-relaxed text-ink/75">
            You&apos;ve already had your free session, so anything you book below is a regular session.
          </div>
        )}

        {/* progress */}
        <nav className="mt-10" aria-label="Booking progress">
          <ol className="flex gap-2 md:gap-3">
            {(free ? STEPS.slice(0, 4) : STEPS).map((label, i) => (
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
                      i === step ? "text-forest-900" : "text-ink/70",
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
                  {t.booking.concernTitle}
                </h2>
                <p className="mt-2 max-w-xl text-ink/65">{t.booking.concernLede}</p>

                {/* Only what somebody is actually qualified to deliver. A
                    service with no practitioner is not shown here at all —
                    the catalogue page says so in words instead. */}
                {narrowTo && (
                  <p className="mt-5 text-[0.9rem] text-ink/65">
                    {t.booking.showingFor.replace("{name}", narrowTo.name)}{" "}
                    <button
                      type="button"
                      onClick={() => setShowAllServices(true)}
                      className="link-draw font-medium text-forest-800"
                    >
                      {t.booking.showAll}
                    </button>
                  </p>
                )}
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pickerServices.map((sv) => (
                    <button
                      key={sv.slug}
                      type="button"
                      onClick={() => {
                        setService(sv);
                        // Keep a therapist chosen elsewhere (a "Book with…"
                        // link) if they take this session; otherwise let go of
                        // them, since the server would refuse the pairing.
                        if (!expert || !expert.services.includes(sv.slug)) {
                          setExpert(null);
                          setSlot({ date: "", time: null });
                        }
                        setTimeout(() => go(1), 260);
                      }}
                      className={cn(
                        "card-lift flex flex-col rounded-2xl border bg-ivory-light p-6 text-left",
                        service?.slug === sv.slug
                          ? "border-gold shadow-bloom ring-1 ring-gold"
                          : "border-forest-800/10 shadow-lift"
                      )}
                      aria-pressed={service?.slug === sv.slug}
                    >
                      <span className="font-display text-lg font-medium leading-snug text-forest-900">
                        {local(sv, locale).title}
                      </span>
                      <span className="mt-1.5 block flex-1 text-sm leading-relaxed text-ink/70">
                        {local(sv, locale).summary}
                      </span>
                      <span className="mt-4 block text-[0.82rem] font-medium text-forest-800">
                        {localDuration(sv, locale)}
                        {(() => {
                          // the real spread across whoever can take it, so the
                          // number on this card is one somebody can be booked at
                          const r = rangeFor(sv.slug);
                          if (!r) return null;
                          return (
                            <>
                              {" · "}
                              {r.min === r.max
                                ? formatINR(r.min)
                                : `${formatINR(r.min)}–${formatINR(r.max)}`}
                            </>
                          );
                        })()}
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
                  {t.booking.expertTitle}
                </h2>
                <p className="mt-2 text-ink/65">
                  {t.booking.expertLede.replace(
                    "{service}",
                    service ? local(service, locale).title : ""
                  )}
                </p>
                {/* One fee for the service, whoever you pick — so it is said
                    once here rather than repeated on every card. */}
                {service && price !== null && (
                  <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-forest-800/12 bg-sage-light/30 px-4 py-2 text-[0.88rem] text-forest-900">
                    <span className="font-semibold">{formatINR(price)}</span>
                    <span className="text-ink/70">
                      {t.booking.feeNote.replace("{duration}", localDuration(service, locale))}
                    </span>
                  </p>
                )}
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
                        <span className="mt-0.5 block text-[0.82rem] text-ink/70">
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
                        <span className="mt-2.5 block text-[0.82rem] text-ink/70">
                          {e.languages.join(" · ")}
                        </span>
                        {/* No price here any more. Everyone on this screen is
                            qualified for the same service, so they all cost the
                            same — the fee is stated once, above the list. */}
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
                  {t.booking.timeTitle2}
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
                    duration={service?.duration}
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 4 — review */}
            {step === 3 && service && expert && slot.date && slot.time && (
              <motion.div
                key="review"
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: EASE }}
              >
                <h2 className="font-display text-2xl font-medium text-forest-900">
                  {t.booking.reviewTitle}
                </h2>
                <p className="mt-2 text-ink/65">
                  {free ? (
                    <>Check the details — your first session is on us, so there&apos;s nothing to pay.</>
                  ) : (
                    <>
                      Check the details — then we&apos;ll hold this time for {HOLD_MINUTES} minutes while
                      you pay.
                    </>
                  )}
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
                      <p className="text-sm text-ink/70">{expert.credentials}</p>
                    </div>
                  </div>

                  <dl className="mt-6 space-y-3.5 text-[0.95rem]">
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink/70">Session</dt>
                      <dd className="text-right font-medium text-forest-900">{local(service, locale).title}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink/70">Date</dt>
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
                      <dt className="text-ink/70">Time</dt>
                      <dd className="font-medium text-forest-900">
                        {slot.time} IST · {localDuration(service, locale).replace(" minutes", " min")}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-forest-800/10 pt-4">
                      <dt className="text-ink/70">{t.booking.fee}</dt>
                      <dd className="text-right font-display text-xl font-medium text-forest-900">
                        {free ? (
                          <>
                            {price !== null && (
                              <s className="mr-2 text-base font-normal text-ink/35">
                                {formatINR(price)}
                              </s>
                            )}
                            Free
                          </>
                        ) : (
                          <Price
                            amount={price}
                            standard={standardPrice("service", service.slug, price)}
                            className="items-end"
                          />
                        )}
                      </dd>
                    </div>

                    {/* the code's effect, spelled out rather than folded into one number */}
                    {!free && discount && (
                      <>
                        <div className="flex justify-between gap-4">
                          <dt className="text-ink/70">
                            Code <span className="font-mono text-forest-700">{discount.code}</span>
                          </dt>
                          <dd className="font-medium text-forest-700">
                            &minus;{formatINR(discount.amount)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4 border-t border-forest-800/10 pt-4">
                          <dt className="text-ink/70">{t.booking.youPay}</dt>
                          <dd className="font-display text-xl font-medium text-forest-900">
                            {formatINR(discount.payable)}
                          </dd>
                        </div>
                      </>
                    )}
                  </dl>

                  {/* nothing to discount on a session that costs nothing */}
                  {!free && (
                    <CodeBox
                      serviceSlug={service.slug}
                      expertId={expert.id}
                      applied={discount}
                      onApplied={setDiscount}
                      initialValue={initialCode}
                      disabled={holding}
                    />
                  )}

                  {needsGuardian && (
                    <GuardianConsent
                      value={guardian}
                      onChange={setGuardian}
                      errors={guardianErrors}
                      disabled={holding}
                    />
                  )}

                  <p className="mt-5 text-[0.82rem] leading-relaxed text-ink/70">
                    {free
                      ? `${changePolicyNote} Cancel in time and your free session comes back to you.`
                      : <>{changePolicyNote} Cancel outside that window and you&apos;re refunded in full.</>}
                  </p>

                  <div className="mt-7">
                    <Button onClick={holdSlot} variant="gold" className="w-full" disabled={holding}>
                      {holding ? (
                        <Spinner label={free ? "Booking your session…" : "Holding your slot…"} />
                      ) : free ? (
                        "Book my free session"
                      ) : (
                        "Hold this time & pay"
                      )}
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
                  {t.booking.payTitle}
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

                <p className="mt-6 max-w-lg text-[0.82rem] text-ink/70">
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
                "link-draw text-sm font-medium text-ink/70 hover:text-forest-900",
                step === 0 && "invisible"
              )}
            >
              ← {t.booking.back}
            </button>
            <Button onClick={() => canContinue && go(step + 1)} variant="forest" disabled={!canContinue}>
              {t.booking.next}
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="mt-12">
            <button
              type="button"
              onClick={() => go(2)}
              className="link-draw text-sm font-medium text-ink/70 hover:text-forest-900"
            >
              ← Change the time
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
