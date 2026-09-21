"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Portal from "@/components/ui/Portal";
import { Field, TextArea } from "@/components/ui/Field";
import { Alert, Spinner } from "@/components/ui/Feedback";
import { headcounts, pillars, segments } from "@/lib/organisations";
import {
  collect,
  hasErrors,
  validateEmail,
  validateName,
  validateRequiredPhone,
} from "@/lib/validation";
import { cn } from "@/lib/utils";

/**
 * "Build your pack" — the institution CTA, as a composer rather than a mailto:.
 *
 * A `mailto:` link asks someone to open a mail client they may not have, then
 * write the brief themselves from a template. This asks the four questions we
 * actually need and lets them assemble the program by tapping the six
 * components — so the shape of the offer is legible *while* they enquire, and
 * what reaches us is already a brief instead of "hi, tell me more".
 *
 * Nothing here is health data — it's a business contact — so it is submitted
 * plainly and never written to browser storage.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

const MESSAGE_MAX = 1200;

export default function PackBuilder({
  open,
  onClose,
  /** Pre-selected when opened from a specific segment card. */
  initialSegment,
}: {
  open: boolean;
  onClose: () => void;
  initialSegment?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // so focus can be handed back to whatever opened the dialog
  const openerRef = useRef<HTMLElement | null>(null);

  const [institution, setInstitution] = useState("");
  const [segment, setSegment] = useState(initialSegment ?? "");
  const [headcount, setHeadcount] = useState("");
  const [components, setComponents] = useState<string[]>([]);
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "code" | "verifying" | "sent">("idle");
  const [devFallback, setDevFallback] = useState<string | null>(null);

  // proving the email and phone are theirs (see lib/contact-verification)
  const [emailToken, setEmailToken] = useState("");
  const [phoneToken, setPhoneToken] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [devCodes, setDevCodes] = useState<{ email?: string; phone?: string }>({});
  const [notice, setNotice] = useState("");

  // follow the card that opened it
  useEffect(() => {
    if (open && initialSegment) setSegment(initialSegment);
  }, [open, initialSegment]);

  // remember the opener, lock the page, restore focus on close
  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // let the panel mount before reaching for the first control
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();
    }, 60);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      openerRef.current?.focus?.();
    };
  }, [open]);

  // Escape closes; Tab is trapped inside the panel
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const toggle = (id: string) =>
    setComponents((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const brief = () => ({
    institution,
    segment,
    headcount,
    components,
    contactName,
    email,
    phone,
    message,
  });

  /** Take whatever codes the server just sent; a channel it didn't resend keeps its token. */
  const takeCodes = (data: {
    emailToken?: string;
    phoneToken?: string;
    devEmailCode?: string;
    devPhoneCode?: string;
    verified?: { email: boolean; phone: boolean };
  }) => {
    if (data.verified?.email) setEmailToken("");
    else if (data.emailToken) {
      setEmailToken(data.emailToken);
      setEmailCode("");
    }
    if (data.verified?.phone) setPhoneToken("");
    else if (data.phoneToken) {
      setPhoneToken(data.phoneToken);
      setPhoneCode("");
    }
    setDevCodes((prev) => ({
      email: data.verified?.email ? undefined : data.devEmailCode ?? prev.email,
      phone: data.verified?.phone ? undefined : data.devPhoneCode ?? prev.phone,
    }));
  };

  /** One round trip. `withCodes` sends back the codes typed so far. */
  const send = async (withCodes: boolean) => {
    const res = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...brief(),
        ...(withCodes
          ? { emailToken, emailCode, phoneToken, phoneCode }
          : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const local = collect([
      ["institution", institution.trim() ? null : "Please tell us which institution this is for."],
      ["segment", segment ? null : "Please choose the kind of institution."],
      ["headcount", headcount ? null : "Please choose an approximate size."],
      ["contactName", validateName(contactName)],
      ["email", validateEmail(email)],
      ["phone", validateRequiredPhone(phone)],
    ]);
    setFields(local);
    if (hasErrors(local)) return;

    setStatus("sending");
    setError("");
    setNotice("");
    try {
      const { res, data } = await send(false);

      if (res.status === 202 && data.needsCode) {
        takeCodes(data);
        setStatus("code");
        return;
      }
      if (!res.ok) {
        if (res.status === 422 && data.fields) setFields(data.fields);
        setError(
          res.status === 422 && data.fields
            ? ""
            : data.error ?? "Something went wrong. Please try again."
        );
        setStatus("idle");
        return;
      }

      setDevFallback(data.devFallback ?? null);
      setStatus("sent");
    } catch {
      setError("Couldn't reach the server. Please check your connection and try again.");
      setStatus("idle");
    }
  };

  /** The codes step: check both codes, and send the brief once both are proven. */
  const onVerify = async (e: FormEvent) => {
    e.preventDefault();

    const local = collect([
      ["emailCode", emailToken && !/^\d{6}$/.test(emailCode) ? "Enter the 6-digit code from the email." : null],
      ["phoneCode", phoneToken && !/^\d{6}$/.test(phoneCode) ? "Enter the 6-digit code from the SMS." : null],
    ]);
    setFields(local);
    if (hasErrors(local)) return;

    setStatus("verifying");
    setError("");
    setNotice("");
    try {
      const { res, data } = await send(true);

      if (res.ok && !data.needsCode) {
        setDevFallback(data.devFallback ?? null);
        setStatus("sent");
        return;
      }
      if (res.status === 202 || (res.status === 422 && data.verified)) {
        // one code accepted, the other wrong (or freshly resent): keep going
        takeCodes(data);
        if (data.fields) setFields(data.fields);
      } else {
        // expired, too many tries, SMS down: new codes are the way forward
        setError(data.error ?? "Something went wrong. Please try again.");
      }
      setStatus("code");
    } catch {
      setError("Couldn't reach the server. Please check your connection and try again.");
      setStatus("code");
    }
  };

  /** Fresh codes for whatever is still unproven. */
  const resendCodes = async () => {
    setStatus("verifying");
    setError("");
    setNotice("");
    setFields({});
    try {
      const { res, data } = await send(false);
      if (res.ok && !data.needsCode) {
        setDevFallback(data.devFallback ?? null);
        setStatus("sent");
        return;
      }
      if (res.status === 202) {
        takeCodes(data);
        setNotice("New codes are on their way. Only the newest ones work.");
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Couldn't reach the server. Please check your connection and try again.");
    }
    setStatus("code");
  };

  /** Back to the brief, e.g. to fix a mistyped email or number. */
  const editDetails = () => {
    setStatus("idle");
    setEmailToken("");
    setPhoneToken("");
    setEmailCode("");
    setPhoneCode("");
    setDevCodes({});
    setFields({});
    setError("");
    setNotice("");
  };

  const chosen = segments.find((s) => s.id === segment);

  return (
    <Portal>
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div
            className="absolute inset-0 bg-forest-950/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-ivory-light shadow-bloom sm:rounded-3xl"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {/* header */}
            <div className="flex items-start justify-between gap-4 border-b border-forest-800/10 px-6 py-5 sm:px-8">
              <div>
                <p className="eyebrow mb-2 flex items-center gap-2.5">
                  <span
                    className="font-deva text-sm normal-case tracking-normal text-gold"
                    aria-hidden="true"
                  >
                    संस्था
                  </span>
                  build your pack
                </p>
                <h2 id={titleId} className="font-display text-2xl font-medium text-forest-900">
                  {status === "sent"
                    ? "That's with us."
                    : status === "code" || status === "verifying"
                      ? "Confirm it's you."
                      : "Tell us about your building."}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-2 -mt-1 shrink-0 rounded-full p-2 text-ink/45 transition-colors hover:bg-forest-800/5 hover:text-forest-900"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {status === "sent" ? (
              <div className="overflow-y-auto overscroll-contain px-6 py-10 text-center sm:px-8">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest-800">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                    <path
                      d="M7 14.5 12 19.5 21 9"
                      stroke="#C8A45D"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <p className="mt-6 text-[1.05rem] leading-relaxed text-ink/75">
                  Thanks, {contactName.split(" ")[0]}. We&apos;ve got your brief for{" "}
                  <span className="font-semibold text-forest-900">{institution}</span>, and a
                  confirmation is on its way to {email}.
                </p>
                <p className="mt-3 text-sm text-ink/55">
                  A real person reads every one of these and replies within one working day.
                </p>

                {devFallback && (
                  <div className="mt-6 rounded-2xl border border-gold/40 bg-gold/10 p-5 text-left">
                    <p className="text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-gold-dark">
                      Development only
                    </p>
                    <p className="mt-2 text-[0.85rem] text-ink/70">
                      No mail provider is configured, so nothing was sent. Here is what would have
                      arrived:
                    </p>
                    <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-[0.75rem] leading-relaxed text-ink/70">
                      {devFallback}
                    </pre>
                  </div>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-8 rounded-full bg-forest-800 px-7 py-3 text-[0.92rem] font-semibold text-ivory transition-colors hover:bg-forest-700"
                >
                  Close
                </button>
              </div>
            ) : status === "code" || status === "verifying" ? (
              <form onSubmit={onVerify} className="overflow-y-auto overscroll-contain px-6 py-6 sm:px-8" noValidate>
                <p className="text-[0.95rem] leading-relaxed text-ink/65">
                  So nobody can send a brief with someone else&apos;s details, we&apos;ve sent a
                  6-digit code to {emailToken && phoneToken ? "each of these" : "this"}. Enter{" "}
                  {emailToken && phoneToken ? "both" : "it"} to send your brief for{" "}
                  <span className="font-semibold text-forest-900">{institution.trim()}</span>.
                </p>

                <div className="mt-6 space-y-5">
                  {emailToken ? (
                    <CodeField
                      label={`Code sent to ${email.trim()}`}
                      value={emailCode}
                      onChange={setEmailCode}
                      error={fields.emailCode}
                      hint="Check spam too. The code works for 10 minutes."
                      devCode={devCodes.email}
                      disabled={status === "verifying"}
                    />
                  ) : (
                    <Confirmed>Email confirmed: {email.trim()}</Confirmed>
                  )}
                  {phoneToken ? (
                    <CodeField
                      label={`Code sent by SMS to ${phone.trim()}`}
                      value={phoneCode}
                      onChange={setPhoneCode}
                      error={fields.phoneCode}
                      hint="It can take a minute to arrive. The code works for 10 minutes."
                      devCode={devCodes.phone}
                      disabled={status === "verifying"}
                    />
                  ) : (
                    <Confirmed>Phone confirmed: {phone.trim()}</Confirmed>
                  )}
                </div>

                {error && (
                  <Alert tone="error" className="mt-6">
                    {error}
                  </Alert>
                )}
                {notice && !error && (
                  <Alert tone="success" className="mt-6">
                    {notice}
                  </Alert>
                )}

                <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-forest-800/10 pt-6">
                  <button
                    type="submit"
                    disabled={status === "verifying"}
                    className="inline-flex items-center gap-2.5 rounded-full bg-gold px-7 py-3 text-[0.95rem] font-semibold text-forest-950 transition-colors duration-300 hover:bg-gold-dark disabled:opacity-60"
                  >
                    {status === "verifying" && <Spinner className="h-4 w-4" />}
                    {status === "verifying" ? "Checking…" : "Verify and send brief"}
                  </button>
                  <button
                    type="button"
                    onClick={resendCodes}
                    disabled={status === "verifying"}
                    className="link-draw text-[0.88rem] font-medium text-forest-800 disabled:opacity-60"
                  >
                    Send new {emailToken && phoneToken ? "codes" : "code"}
                  </button>
                  <button
                    type="button"
                    onClick={editDetails}
                    disabled={status === "verifying"}
                    className="link-draw text-[0.88rem] font-medium text-forest-800 disabled:opacity-60"
                  >
                    Edit details
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={onSubmit} className="overflow-y-auto overscroll-contain px-6 py-6 sm:px-8" noValidate>
                <p className="text-[0.95rem] leading-relaxed text-ink/65">
                  Four questions, then pick what you&apos;d want in the program. Nothing here is
                  binding — it just means our first reply is useful instead of generic.
                </p>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field
                      label="Institution"
                      value={institution}
                      onChange={setInstitution}
                      error={fields.institution}
                      placeholder="St. Xavier's, Bengaluru"
                      maxLength={120}
                      required
                      disabled={status === "sending"}
                    />
                  </div>

                  <SelectField
                    label="Kind of institution"
                    value={segment}
                    onChange={setSegment}
                    error={fields.segment}
                    disabled={status === "sending"}
                    options={segments.map((s) => ({ value: s.id, label: s.name }))}
                  />

                  <SelectField
                    label="Approximate size"
                    value={headcount}
                    onChange={setHeadcount}
                    error={fields.headcount}
                    disabled={status === "sending"}
                    options={headcounts.map((h) => ({ value: h, label: h }))}
                    hint={chosen ? `Students, staff or team — whichever fits.` : undefined}
                  />
                </div>

                {/* the pack itself */}
                <fieldset className="mt-8">
                  <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/50">
                    What should be in it?
                  </legend>
                  <p className="mt-2 text-[0.85rem] text-ink/55">
                    Optional. Most programs start with two or three and grow.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {pillars.map((p) => {
                      const on = components.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggle(p.id)}
                          aria-pressed={on}
                          disabled={status === "sending"}
                          className={cn(
                            "rounded-full border px-4 py-2 text-left text-[0.85rem] font-medium transition duration-300 ease-silk disabled:opacity-60",
                            on
                              ? "border-gold bg-gold text-forest-950 shadow-lift"
                              : "border-forest-800/20 text-forest-800 hover:border-forest-800 hover:bg-forest-800/5"
                          )}
                        >
                          {p.title}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Your name"
                    value={contactName}
                    onChange={setContactName}
                    error={fields.contactName}
                    autoComplete="name"
                    required
                    disabled={status === "sending"}
                  />
                  <Field
                    label="Work email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    error={fields.email}
                    autoComplete="email"
                    inputMode="email"
                    required
                    disabled={status === "sending"}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="Phone"
                      type="tel"
                      value={phone}
                      onChange={setPhone}
                      error={fields.phone}
                      autoComplete="tel"
                      inputMode="tel"
                      hint="We'll text a code to confirm it's yours."
                      required
                      disabled={status === "sending"}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <TextArea
                      label="What's prompting this?"
                      value={message}
                      onChange={setMessage}
                      error={fields.message}
                      rows={3}
                      maxLength={MESSAGE_MAX}
                      hint="Optional. A sentence is plenty."
                      disabled={status === "sending"}
                    />
                  </div>
                </div>

                {error && (
                  <Alert tone="error" className="mt-6">
                    {error}
                  </Alert>
                )}

                <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-forest-800/10 pt-6">
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="inline-flex items-center gap-2.5 rounded-full bg-gold px-7 py-3 text-[0.95rem] font-semibold text-forest-950 transition-colors duration-300 hover:bg-gold-dark disabled:opacity-60"
                  >
                    {status === "sending" && <Spinner className="h-4 w-4" />}
                    {status === "sending" ? "Sending…" : "Send my brief"}
                  </button>
                  <p className="text-[0.8rem] text-ink/50">
                    Next, we&apos;ll confirm your email and phone with a quick code.
                  </p>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </Portal>
  );
}

/** A select styled to match `Field`, which only covers inputs and textareas. */
function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  hint,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  hint?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-ink/55"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={cn(
          "w-full appearance-none rounded-xl border bg-ivory-light bg-[length:16px] bg-[right_1rem_center] bg-no-repeat px-4 py-3 text-[0.95rem] text-forest-900 transition-colors duration-300 focus:outline-none disabled:opacity-60",
          error
            ? "border-red-300 focus:border-red-500"
            : "border-forest-800/15 focus:border-forest-800"
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%231F2D28' stroke-opacity='0.5' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
        }}
      >
        <option value="">Choose…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-[0.82rem] text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-[0.8rem] leading-relaxed text-ink/50">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** A 6-digit code box for the confirm step. */
function CodeField({
  label,
  value,
  onChange,
  error,
  hint,
  devCode,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint: string;
  devCode?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-ink/55"
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-note`}
        className={cn(
          "w-full max-w-[14rem] rounded-xl border bg-ivory-light px-4 py-3 text-center font-display text-2xl tracking-[0.4em] text-forest-900 placeholder:text-ink/20 transition-colors focus:outline-none disabled:opacity-60",
          error ? "border-red-300 focus:border-red-500" : "border-forest-800/15 focus:border-forest-800"
        )}
      />
      <p
        id={`${id}-note`}
        className={cn("mt-1.5 text-[0.8rem]", error ? "text-red-700" : "text-ink/50")}
      >
        {error ?? hint}
      </p>
      {devCode && (
        <p className="mt-2 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-[0.8rem] text-ink/70">
          Development only: nothing was delivered, so the code is{" "}
          <span className="font-semibold">{devCode}</span>.
        </p>
      )}
    </div>
  );
}

function Confirmed({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 rounded-xl border border-forest-800/10 bg-sage-light/40 px-4 py-3 text-[0.9rem] text-forest-900">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3.5 8.5 6.5 11.5 12.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </p>
  );
}
