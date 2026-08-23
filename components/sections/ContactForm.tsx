"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

const fieldBase =
  "peer w-full rounded-2xl border border-forest-800/15 bg-ivory-light px-5 pb-3 pt-6 text-[0.97rem] text-ink placeholder-transparent transition-colors focus:border-gold focus:outline-none";
const labelBase =
  "pointer-events-none absolute left-5 top-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink/50 transition-all duration-300 ease-silk peer-placeholder-shown:top-[1.05rem] peer-placeholder-shown:text-[0.95rem] peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-ink/45 peer-focus:top-2 peer-focus:text-[0.7rem] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-[0.14em] peer-focus:text-gold-dark";

/**
 * Stubbed submit — wire to /api/contact (or a form service) later;
 * the form data is already named and ready to serialize.
 */
export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    setTimeout(() => setStatus("sent"), 900);
  };

  if (status === "sent") {
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
          A real person — not a bot — will write back within one working day.
          If it&apos;s urgent, WhatsApp is faster.
        </p>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-3xl border border-forest-800/10 bg-ivory-light p-8 shadow-lift md:p-10"
      aria-label="Contact form"
    >
      <div className="relative">
        <input id="name" name="name" type="text" required placeholder="Your name" className={fieldBase} />
        <label htmlFor="name" className={labelBase}>
          Your name
        </label>
      </div>
      <div className="relative">
        <input id="email" name="email" type="email" required placeholder="Your email" className={fieldBase} />
        <label htmlFor="email" className={labelBase}>
          Your email
        </label>
      </div>
      <div className="relative">
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="What's on your mind?"
          className={`${fieldBase} resize-none`}
        />
        <label htmlFor="message" className={labelBase}>
          What&apos;s on your mind?
        </label>
      </div>
      <Button type="submit" variant="forest" className="w-full" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send message"}
      </Button>
      <p className="text-center text-xs leading-relaxed text-ink/45">
        Whatever you write here stays between us — same as a session.
      </p>
    </form>
  );
}
