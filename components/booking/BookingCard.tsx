"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CancelBookingButton from "@/components/booking/CancelBookingButton";
import RescheduleDialog from "@/components/booking/RescheduleDialog";
import PaymentPanel from "@/components/booking/PaymentPanel";
import { Alert } from "@/components/ui/Feedback";
import { useNow } from "@/components/ui/useNow";
import { addMinutes, formatClinicTime, humanGap } from "@/lib/clinic-time";
import { JOIN_OPENS_MINUTES_BEFORE, meetingAccess } from "@/lib/expert-portal";
import { concerns, experts } from "@/lib/experts";
import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  SESSION_MINUTES,
  hoursUntil,
} from "@/lib/features/booking/policy";
import { cn, formatDateISO, formatINR } from "@/lib/utils";
import type { SerializedBooking } from "@/lib/features/booking/server";

/**
 * One session, in every state it can be in: waiting on payment, confirmed,
 * moved, cancelled with or without a refund, or lapsed unpaid.
 *
 * The concern is shown because it's the owner's own page. It is deliberately
 * absent from anything anyone else can see.
 */

type Tone = "confirmed" | "pending" | "failed" | "cancelled" | "expired" | "refunded";

const chips: Record<Tone, { label: string; cls: string }> = {
  confirmed: { label: "Confirmed", cls: "bg-sage-light/70 text-forest-800" },
  pending: { label: "Payment due", cls: "bg-gold/20 text-gold-dark" },
  failed: { label: "Payment failed", cls: "bg-red-50 text-red-700" },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-700" },
  expired: { label: "Expired", cls: "bg-forest-800/8 text-ink/55" },
  refunded: { label: "Refunded", cls: "bg-forest-100 text-forest-700" },
};

function toneOf(b: SerializedBooking): Tone {
  if (b.status === BOOKING_STATUS.cancelled) {
    return b.payment?.status === PAYMENT_STATUS.refunded ? "refunded" : "cancelled";
  }
  if (b.status === BOOKING_STATUS.expired) return "expired";
  if (b.status === BOOKING_STATUS.confirmed) return "confirmed";
  return b.payment?.status === PAYMENT_STATUS.failed ? "failed" : "pending";
}

/**
 * The client's side of the meeting room.
 *
 * The practitioner pastes a link; this decides whether the client may see it,
 * on exactly the schedule the portal promises them — open fifteen minutes
 * before, closed half an hour after. Every other state says why, because a
 * link that is quietly absent is worse than one that explains itself.
 */
function MeetingRow({
  booking,
  serverNow,
}: {
  booking: SerializedBooking;
  serverNow: string;
}) {
  const router = useRouter();
  const now = useNow(serverNow, 20_000);
  const server = booking.meeting;

  // Recompute on the viewer's own clock, so a tab left open since morning still
  // tells the truth. The URL is the one thing we cannot derive — the server
  // withholds it until the door opens — so when our clock says it should be
  // open and we still hold no link, ask the server once for a fresh copy.
  const access = meetingAccess(
    {
      date: booking.date,
      time: booking.time,
      status: booking.status,
      meetingUrl: server?.state === "open" ? server.url : null,
    },
    SESSION_MINUTES,
    now
  );

  const justOpened = access.state === "missing" && server?.state === "early";
  useEffect(() => {
    if (justOpened) router.refresh();
  }, [justOpened, router]);

  if (!server) return null;

  if (access.state === "open") {
    return (
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-forest-800/10 bg-sage-light/40 px-5 py-4">
        <a
          href={access.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-forest-800 px-5 py-2.5 text-[0.88rem] font-semibold text-ivory transition-colors hover:bg-forest-700"
        >
          Join session
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M6 3h7v7M13 3 4 12"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
        <p className="text-[0.85rem] text-ink/65">
          Your therapist is expecting you. The room closes {humanGap(access.closesInMinutes)}.
        </p>
      </div>
    );
  }

  if (access.state === "early") {
    return (
      <p className="mt-5 rounded-2xl border border-forest-800/10 bg-ivory px-5 py-3.5 text-[0.85rem] text-ink/65">
        The meeting room opens at{" "}
        <span className="font-medium text-forest-800">
          {formatClinicTime(addMinutes(booking.time, -JOIN_OPENS_MINUTES_BEFORE))}
        </span>
        , {JOIN_OPENS_MINUTES_BEFORE} minutes before you start — {humanGap(access.opensInMinutes)}.
        The link appears right here, on this page.
      </p>
    );
  }

  if (access.state === "missing") {
    return (
      <p className="mt-5 rounded-2xl border border-gold/40 bg-gold/10 px-5 py-3.5 text-[0.85rem] text-forest-900">
        Your therapist hasn&apos;t opened the meeting room yet. It usually appears just before the
        session — this page will show the link the moment it does.{" "}
        <Link href="/contact" className="font-medium underline underline-offset-2">
          Tell us if it doesn&apos;t
        </Link>
        .
      </p>
    );
  }

  // closed, or a session that was cancelled — the card already says so
  return null;
}

function paidWith(b: SerializedBooking): string | null {
  const p = b.payment;
  if (!p || p.status !== PAYMENT_STATUS.paid) return null;
  if (p.method === "card") return `${p.cardBrand ?? "Card"} •••• ${p.last4 ?? "••••"}`;
  return p.vpaMasked ?? "UPI";
}

export default function BookingCard({
  booking,
  upcoming,
  serverNow,
}: {
  booking: SerializedBooking;
  upcoming: boolean;
  /** The server's instant, so the join countdown starts without a hydration mismatch. */
  serverNow: string;
}) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);

  const expert = experts.find((e) => e.id === booking.expertId);
  const concern = concerns.find((c) => c.id === booking.concern);
  const tone = toneOf(booking);
  const chip = chips[tone];

  const dimmed = tone === "cancelled" || tone === "expired" || tone === "refunded";
  const needsPayment =
    booking.status === BOOKING_STATUS.pendingPayment &&
    hoursUntil(booking.date, booking.time) > 0;
  const method = paidWith(booking);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-ivory-light p-6 shadow-lift transition-opacity",
        dimmed ? "border-forest-800/10 opacity-70" : "border-forest-800/10"
      )}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {expert && (
          <Image
            src={expert.photo}
            alt={`Portrait of ${booking.expertName}`}
            width={150}
            height={150}
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-display text-lg font-medium text-forest-900">
              {booking.expertName}
            </p>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em]",
                chip.cls
              )}
            >
              {chip.label}
            </span>
          </div>

          <p className="mt-1 text-sm text-ink/65">
            {formatDateISO(booking.date)} · {booking.time} IST · {SESSION_MINUTES} min
            {concern && <> · {concern.label}</>}
          </p>

          <p className="mt-1 text-sm text-ink/55">
            Ref{" "}
            <span className="font-mono font-semibold text-forest-800">{booking.ref}</span> ·{" "}
            {formatINR(booking.amount)}
            {method && <> · {method}</>}
          </p>

          {booking.previousDate && booking.status === BOOKING_STATUS.confirmed && (
            <p className="mt-1 text-[0.8rem] text-ink/45">
              Moved from {formatDateISO(booking.previousDate)}
              {booking.previousTime ? ` at ${booking.previousTime}` : ""}
            </p>
          )}

          {booking.payment?.status === PAYMENT_STATUS.refunded && (
            <p className="mt-1 text-[0.8rem] text-forest-700">
              {formatINR(booking.payment.refundAmount ?? 0)} refunded — allow 5–7 working days.
            </p>
          )}
        </div>

        {upcoming && !dimmed && (
          <div className="flex shrink-0 flex-wrap items-center gap-5">
            {booking.status === BOOKING_STATUS.confirmed && (
              <>
                <a
                  href={`/api/bookings/${booking.id}/calendar`}
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-forest-800 hover:text-forest-600"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                    <rect x="2.5" y="4" width="15" height="13" rx="2" />
                    <path d="M6 2.5v3M14 2.5v3M2.5 8h15M10 10.5v4M8 12.5h4" strokeLinecap="round" />
                  </svg>
                  Add to calendar
                </a>
                <RescheduleDialog booking={booking} />
              </>
            )}
            <CancelBookingButton booking={booking} />
          </div>
        )}
      </div>

      <MeetingRow booking={booking} serverNow={serverNow} />

      {/* payment still owed */}
      {needsPayment && !paying && (
        <Alert
          tone={booking.payment?.status === PAYMENT_STATUS.failed ? "error" : "warning"}
          className="mt-5"
          title={
            booking.payment?.status === PAYMENT_STATUS.failed
              ? "Your last payment didn't go through."
              : "This session isn't confirmed yet."
          }
          action={
            <>
              <button
                type="button"
                onClick={() => setPaying(true)}
                className="rounded-full bg-forest-800 px-5 py-2 text-[0.85rem] font-semibold text-ivory transition-colors hover:bg-forest-700"
              >
                Complete payment
              </button>
              <Link
                href="/contact"
                className="self-center text-[0.85rem] font-medium text-forest-800 underline underline-offset-2"
              >
                Get help with this
              </Link>
            </>
          }
        >
          {booking.payment?.failureMessage ??
            "We're holding this time only briefly. Pay now to lock it in — nothing has been charged yet."}
        </Alert>
      )}

      {needsPayment && paying && (
        <div className="mt-6 rounded-2xl border border-forest-800/10 bg-ivory p-6">
          <PaymentPanel
            booking={booking}
            onPaid={() => {
              setPaying(false);
              router.refresh();
            }}
            onExpired={() => {
              setPaying(false);
              router.refresh();
            }}
          />
        </div>
      )}

      {booking.status === BOOKING_STATUS.expired && (
        <p className="mt-4 text-[0.85rem] text-ink/55">
          This hold lapsed before it was paid for, so the time went back to the calendar. Nothing was
          charged.{" "}
          <Link href="/book" className="link-draw font-medium text-forest-800">
            Book again
          </Link>
        </p>
      )}
    </div>
  );
}
