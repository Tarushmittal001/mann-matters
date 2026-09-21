"use client";

import { useEffect, useId, useRef, type FormEvent } from "react";
import { Alert, Spinner } from "@/components/ui/Feedback";
import type { useContactMessage } from "@/components/contact/useContactMessage";
import { cn } from "@/lib/utils";

/**
 * "Check your inbox": the step between writing a message and it being sent,
 * shared by the email composer and the contact form.
 */
export default function CodeStep({
  c,
  className,
}: {
  c: ReturnType<typeof useContactMessage>;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // the contact page can show this twice (form and popup), so ids stay unique
  const id = useId();
  const verifying = c.status === "verifying";
  const busy = verifying || c.status === "sending";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    c.verify();
  };

  return (
    <form onSubmit={onSubmit} noValidate className={className}>
      <p className="text-[1rem] leading-relaxed text-ink/75">
        To keep anyone from writing to us as someone else, we&apos;ve sent a 6-digit code to{" "}
        <span className="font-semibold text-forest-900">{c.email.trim()}</span>. Enter it to send
        your message.
      </p>

      <label
        htmlFor={id}
        className="mb-1.5 mt-6 block text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-ink/55"
      >
        Code
      </label>
      <input
        ref={inputRef}
        id={id}
        value={c.code}
        onChange={(e) => c.setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        disabled={busy}
        aria-invalid={c.fields.code ? true : undefined}
        aria-describedby={c.fields.code ? `${id}-error` : `${id}-hint`}
        className={cn(
          "w-full max-w-[14rem] rounded-xl border bg-ivory-light px-4 py-3 text-center font-display text-2xl tracking-[0.4em] text-forest-900 placeholder:text-ink/20 transition-colors focus:outline-none disabled:opacity-60",
          c.fields.code ? "border-red-300 focus:border-red-500" : "border-forest-800/15 focus:border-forest-800"
        )}
      />
      {c.fields.code ? (
        <p id={`${id}-error`} className="mt-1.5 text-[0.82rem] text-red-700">
          {c.fields.code}
        </p>
      ) : (
        <p id={`${id}-hint`} className="mt-1.5 text-[0.8rem] text-ink/50">
          It can take a minute, and sometimes lands in spam. The code works for 10 minutes.
        </p>
      )}

      {c.devCode && (
        <p className="mt-3 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-[0.8rem] text-ink/70">
          Development only: no mail provider is set, so the code is{" "}
          <span className="font-semibold">{c.devCode}</span>.
        </p>
      )}

      {c.error && (
        <Alert tone="error" className="mt-5">
          {c.error}
        </Alert>
      )}
      {c.notice && !c.error && (
        <Alert tone="success" className="mt-5">
          {c.notice}
        </Alert>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2.5 rounded-full bg-gold px-7 py-3 text-[0.95rem] font-semibold text-forest-950 transition-colors duration-300 hover:bg-gold-dark disabled:opacity-60"
        >
          {verifying && <Spinner className="h-4 w-4" />}
          {verifying ? "Sending…" : "Verify and send"}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.85rem] text-ink/55">
        <button
          type="button"
          onClick={c.resend}
          disabled={busy}
          className="link-draw font-medium text-forest-800 disabled:opacity-60"
        >
          Send a new code
        </button>
        <button
          type="button"
          onClick={c.changeEmail}
          disabled={busy}
          className="link-draw font-medium text-forest-800 disabled:opacity-60"
        >
          Change email
        </button>
      </div>
    </form>
  );
}
