"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Alert, Spinner } from "@/components/ui/Feedback";
import {
  PAY_METHODS,
  cardBrand,
  digitsOnly,
  validateCard,
  validateUpi,
  type PayMethod,
} from "@/lib/payment-fields";
import { HOLD_MINUTES } from "@/lib/features/booking/policy";
import { cn, formatINR } from "@/lib/utils";
import type { SerializedBooking } from "@/lib/features/booking/server";

/**
 * The payment step.
 *
 * Nothing entered here is kept: the card number and CVV live in component state
 * for as long as the form is open, go to the server once, and are replaced in
 * the record by a brand and last four. The inputs are marked so password
 * managers offer to fill them and browsers don't quietly cache them elsewhere.
 *
 * Every failure the gateway can return has a written state below, because "your
 * payment failed" with no next step is where people abandon a booking they
 * actually wanted.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

type Phase = "idle" | "paying" | "failed" | "expired";

function formatCardNumber(raw: string) {
  return digitsOnly(raw).slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(raw: string) {
  const d = digitsOnly(raw).slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
}

/** A live count of how long the slot stays held, so the pressure is visible and honest. */
function useHoldCountdown(iso: string | null) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!iso) return setLeft(null);
    const tick = () => setLeft(Math.max(0, new Date(iso).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [iso]);

  if (left === null) return null;
  const mins = Math.floor(left / 60000);
  const secs = Math.floor((left % 60000) / 1000);
  return { expired: left <= 0, label: `${mins}:${String(secs).padStart(2, "0")}` };
}

export default function PaymentPanel({
  booking,
  onPaid,
  onExpired,
}: {
  booking: SerializedBooking;
  onPaid: (booking: SerializedBooking) => void;
  onExpired: () => void;
}) {
  const [method, setMethod] = useState<PayMethod>("upi");
  const [vpa, setVpa] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

  const [phase, setPhase] = useState<Phase>("idle");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<{ message: string; retryable: boolean } | null>(null);

  const hold = useHoldCountdown(booking.holdExpiresAt);
  const attempts = booking.payment?.attempts ?? 0;

  useEffect(() => {
    if (hold?.expired && phase !== "expired") {
      setPhase("expired");
      onExpired();
    }
  }, [hold?.expired, phase, onExpired]);

  const brand = useMemo(() => (number ? cardBrand(number) : ""), [number]);

  const submit = async () => {
    const local =
      method === "card"
        ? validateCard({ number, expiry, cvv, name: cardName })
        : validateUpi(vpa);

    setFields(local);
    if (Object.keys(local).length) return;

    setPhase("paying");
    setFailure(null);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          method,
          ...(method === "card"
            ? { card: { number: digitsOnly(number), expiry, cvv, name: cardName } }
            : { vpa: vpa.trim() }),
        }),
      });
      const data = await res.json();

      if (res.ok) {
        // clear the instrument from memory the moment it's no longer needed
        setNumber("");
        setCvv("");
        setExpiry("");
        onPaid(data.booking);
        return;
      }

      if (res.status === 410) {
        setPhase("expired");
        onExpired();
        return;
      }

      if (res.status === 422 && data.fields) {
        setFields(data.fields);
        setPhase("idle");
        return;
      }

      setFailure({
        message: data.error ?? "That payment didn't go through.",
        retryable: data.retryable ?? true,
      });
      setPhase("failed");
    } catch {
      setFailure({
        message:
          "We couldn't reach the payment network. Nothing has been charged — your slot is still held.",
        retryable: true,
      });
      setPhase("failed");
    }
  };

  if (phase === "expired") {
    return (
      <Alert tone="warning" title="Your hold has lapsed.">
        We could only keep that time for {HOLD_MINUTES} minutes. Nothing was charged. Pick a time
        again and it&apos;ll only take a moment.
      </Alert>
    );
  }

  const busy = phase === "paying";

  return (
    <div className="space-y-6">
      {/* hold timer */}
      {hold && !hold.expired && (
        <p className="flex items-center gap-2 text-[0.85rem] text-ink/60">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
          </span>
          Holding this time for you —{" "}
          <span className="font-semibold tabular-nums text-forest-800">{hold.label}</span>
        </p>
      )}

      {/* failure */}
      {phase === "failed" && failure && (
        <Alert
          tone="error"
          title={failure.retryable ? "That didn't go through." : "Your bank declined it."}
        >
          {failure.message}
          {attempts >= 2 && (
            <span className="mt-2 block text-[0.85rem] opacity-80">
              Two attempts haven&apos;t worked. Try the other method below, or{" "}
              <a href="/contact" className="font-semibold underline underline-offset-2">
                message us
              </a>{" "}
              and we&apos;ll hold this slot manually.
            </span>
          )}
        </Alert>
      )}

      {/* method */}
      <div>
        <p className="mb-2.5 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-ink/55">
          How would you like to pay?
        </p>
        <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Payment method">
          {PAY_METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={method === m.id}
              disabled={busy}
              onClick={() => {
                setMethod(m.id);
                setFields({});
                setFailure(null);
                setPhase("idle");
              }}
              className={cn(
                "rounded-2xl border px-5 py-3 text-left transition-all duration-300 ease-silk disabled:opacity-60",
                method === m.id
                  ? "border-gold bg-gold/10 shadow-lift"
                  : "border-forest-800/15 bg-ivory-light hover:border-forest-800/40"
              )}
            >
              <span className="block text-[0.95rem] font-semibold text-forest-900">{m.label}</span>
              <span className="mt-0.5 block text-[0.78rem] text-ink/55">{m.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {/* instrument */}
      <motion.div
        key={method}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="space-y-4"
      >
        {method === "upi" ? (
          <Field
            label="UPI ID"
            required
            value={vpa}
            onChange={setVpa}
            placeholder="yourname@okhdfcbank"
            autoComplete="off"
            disabled={busy}
            error={fields.vpa}
            hint="We'll send a collect request to your UPI app. Approve it there to confirm."
          />
        ) : (
          <>
            <Field
              label="Card number"
              required
              value={formatCardNumber(number)}
              onChange={(v) => setNumber(digitsOnly(v).slice(0, 19))}
              placeholder="1234 5678 9012 3456"
              inputMode="numeric"
              autoComplete="cc-number"
              disabled={busy}
              error={fields.number}
              hint={brand && !fields.number ? brand : undefined}
            />
            <div className="flex gap-4">
              <Field
                label="Expiry"
                required
                value={formatExpiry(expiry)}
                onChange={(v) => setExpiry(v)}
                placeholder="MM/YY"
                inputMode="numeric"
                autoComplete="cc-exp"
                disabled={busy}
                error={fields.expiry}
              />
              <Field
                label="CVV"
                required
                value={cvv}
                onChange={(v) => setCvv(digitsOnly(v).slice(0, 4))}
                placeholder="•••"
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                disabled={busy}
                error={fields.cvv}
              />
            </div>
            <Field
              label="Name on card"
              required
              value={cardName}
              onChange={setCardName}
              placeholder="As printed on the card"
              autoComplete="cc-name"
              disabled={busy}
              error={fields.cardName}
            />
          </>
        )}
      </motion.div>

      <Button onClick={submit} variant="gold" className="w-full" disabled={busy}>
        {busy ? (
          <>
            <Spinner label="Contacting your bank…" />
          </>
        ) : (
          `Pay ${formatINR(booking.amount)}`
        )}
      </Button>

      <p className="flex items-start gap-2 text-[0.78rem] leading-relaxed text-ink/45">
        <svg viewBox="0 0 16 16" className="mt-[2px] h-3.5 w-3.5 shrink-0 fill-forest-600" aria-hidden="true">
          <path d="M8 1 3 3.2v3.6c0 3.1 2.1 6 5 6.9 2.9-.9 5-3.8 5-6.9V3.2L8 1Zm0 4.2a1.3 1.3 0 0 1 .65 2.43V9.3a.65.65 0 0 1-1.3 0V7.63A1.3 1.3 0 0 1 8 5.2Z" />
        </svg>
        Your card details go straight to the payment network — we never store them. We keep only the
        card type and last four digits, so you can recognise the payment later.
      </p>
    </div>
  );
}
