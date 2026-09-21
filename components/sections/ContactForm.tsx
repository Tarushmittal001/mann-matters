"use client";

import { type FormEvent } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { useContactMessage } from "@/components/contact/useContactMessage";
import CodeStep from "@/components/contact/CodeStep";
import { cn } from "@/lib/utils";

const fieldBase =
  "peer w-full rounded-2xl border bg-ivory-light px-5 pb-3 pt-6 text-[0.97rem] text-ink placeholder-transparent transition-colors focus:border-gold focus:outline-none disabled:opacity-60";
const labelBase =
  "pointer-events-none absolute left-5 top-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink/50 transition duration-300 ease-silk peer-placeholder-shown:top-[1.05rem] peer-placeholder-shown:text-[0.95rem] peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-ink/45 peer-focus:top-2 peer-focus:text-[0.7rem] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-[0.14em] peer-focus:text-gold-dark";

const border = (invalid?: string) => (invalid ? "border-red-300" : "border-forest-800/15");

function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 px-1 text-[0.82rem] text-red-700">
      {children}
    </p>
  );
}

/** Sends to our inbox through /api/contact, the same path as the email composer. */
export default function ContactForm() {
  const c = useContactMessage();
  const sending = c.status === "sending";

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    c.submit();
  };

  if (c.status === "sent") {
    return (
      <motion.div
        className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-3xl border border-forest-800/10 bg-ivory-light p-10 text-center shadow-lift"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        role="status"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-forest-800">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <path d="M6 13.5 11 18.5 20 8.5" stroke="#C8A45D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h3 className="mt-6 font-display text-2xl font-medium text-forest-900">Message received.</h3>
        <p className="mt-3 max-w-sm leading-relaxed text-ink/65">
          A real person — not a bot — will write back to {c.email.trim()} within one working day.
          If it&apos;s urgent, WhatsApp is faster.
        </p>
        {c.devFallback && (
          <p className="mt-4 max-w-sm text-xs text-ink/50">
            Development only: no mail provider is configured, so this was logged, not sent.
          </p>
        )}
      </motion.div>
    );
  }

  if (c.status === "code" || c.status === "verifying") {
    return (
      <div className="rounded-3xl border border-forest-800/10 bg-ivory-light p-8 shadow-lift md:p-10">
        <h3 className="mb-4 font-display text-2xl font-medium text-forest-900">Check your inbox</h3>
        <CodeStep c={c} />
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-5 rounded-3xl border border-forest-800/10 bg-ivory-light p-8 shadow-lift md:p-10"
      aria-label="Contact form"
    >
      <div>
        <div className="relative">
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            maxLength={80}
            placeholder="Your name"
            value={c.name}
            onChange={(e) => c.setName(e.target.value)}
            disabled={sending}
            aria-invalid={c.fields.name ? true : undefined}
            aria-describedby={c.fields.name ? "name-error" : undefined}
            className={cn(fieldBase, border(c.fields.name))}
          />
          <label htmlFor="name" className={labelBase}>
            Your name
          </label>
        </div>
        <FieldError id="name-error">{c.fields.name}</FieldError>
      </div>
      <div>
        <div className="relative">
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="Your email"
            value={c.email}
            onChange={(e) => c.setEmail(e.target.value)}
            disabled={sending}
            aria-invalid={c.fields.email ? true : undefined}
            aria-describedby={c.fields.email ? "email-error" : undefined}
            className={cn(fieldBase, border(c.fields.email))}
          />
          <label htmlFor="email" className={labelBase}>
            Your email
          </label>
        </div>
        <FieldError id="email-error">{c.fields.email}</FieldError>
      </div>
      <div>
        <div className="relative">
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            maxLength={3000}
            placeholder="What's on your mind?"
            value={c.message}
            onChange={(e) => c.setMessage(e.target.value)}
            disabled={sending}
            aria-invalid={c.fields.message ? true : undefined}
            aria-describedby={c.fields.message ? "message-error" : undefined}
            className={cn(fieldBase, border(c.fields.message), "resize-none")}
          />
          <label htmlFor="message" className={labelBase}>
            What&apos;s on your mind?
          </label>
        </div>
        <FieldError id="message-error">{c.fields.message}</FieldError>
      </div>
      {c.error && <Alert tone="error">{c.error}</Alert>}
      <Button type="submit" variant="forest" className="w-full" disabled={sending}>
        {sending ? "Sending…" : "Send message"}
      </Button>
      <p className="text-center text-xs leading-relaxed text-ink/45">
        We&apos;ll email you a code first to confirm the address is yours. Whatever you write
        stays between us, same as a session.
      </p>
    </form>
  );
}
