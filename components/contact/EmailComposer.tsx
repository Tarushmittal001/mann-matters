"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Field, TextArea } from "@/components/ui/Field";
import { Alert, Spinner } from "@/components/ui/Feedback";
import { useContactMessage } from "@/components/contact/useContactMessage";
import CodeStep from "@/components/contact/CodeStep";
import { site } from "@/lib/site";

/**
 * What opens when someone clicks our email address.
 *
 * A bare `mailto:` does nothing on a computer with no mail app set up, which is
 * most of them, so the click opens a small "new email" window instead and the
 * message is sent from here to our inbox. People who would rather use their own
 * mail still can: Gmail, their mail app, or copy the address.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export default function EmailComposer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const c = useContactMessage();
  const { status, reset } = c;
  const [copied, setCopied] = useState(false);
  // portalled to <body>: a link inside an animated section would otherwise trap
  // this fixed layer under that section, beneath the safety notice on phones
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // remember the opener, lock the page, restore focus on close
  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("input, textarea")?.focus();
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
        "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled])"
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

  // once closed, a sent message shouldn't greet them on the next click
  useEffect(() => {
    if (!open && status === "sent") reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    c.submit();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked; the address is on screen to select by hand
    }
  };

  const sending = status === "sending";
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(site.email)}`;

  if (!mounted) return null;

  return createPortal(
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
            className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-ivory-light text-left text-ink shadow-bloom sm:rounded-3xl"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {/* header, laid out like a new email */}
            <div className="flex items-start justify-between gap-4 border-b border-forest-800/10 px-6 py-5 sm:px-8">
              <div className="min-w-0">
                <p className="eyebrow mb-2">new email</p>
                <h2 id={titleId} className="font-display text-2xl font-medium text-forest-900">
                  {status === "sent"
                    ? "Sent. Thank you."
                    : status === "code" || status === "verifying"
                      ? "Check your inbox"
                      : "Write to us"}
                </h2>
                {(status === "idle" || status === "sending") && (
                  <p className="mt-1.5 truncate text-[0.9rem] text-ink/60">
                    To:{" "}
                    <span className="font-medium text-forest-900">Emoraa &lt;{site.email}&gt;</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-2 -mt-1 shrink-0 rounded-full p-2 text-ink/45 transition-colors hover:bg-forest-800/5 hover:text-forest-900"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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
                  Thanks, {c.name.trim().split(" ")[0]}. Your message is with us, and we&apos;ll
                  reply to <span className="font-semibold text-forest-900">{c.email.trim()}</span>{" "}
                  within one working day.
                </p>
                <p className="mt-3 text-sm text-ink/55">If it&apos;s urgent, WhatsApp is faster.</p>

                {c.devFallback && (
                  <div className="mt-6 rounded-2xl border border-gold/40 bg-gold/10 p-5 text-left">
                    <p className="text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-gold-dark">
                      Development only
                    </p>
                    <p className="mt-2 text-[0.85rem] text-ink/70">
                      No mail provider is configured, so nothing was sent. Here is what would have
                      arrived:
                    </p>
                    <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-[0.75rem] leading-relaxed text-ink/70">
                      {c.devFallback}
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
              <CodeStep c={c} className="overflow-y-auto overscroll-contain px-6 py-6 sm:px-8" />
            ) : (
              <form onSubmit={onSubmit} className="overflow-y-auto overscroll-contain px-6 py-6 sm:px-8" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Your name"
                    value={c.name}
                    onChange={c.setName}
                    error={c.fields.name}
                    autoComplete="name"
                    maxLength={80}
                    required
                    disabled={sending}
                  />
                  <Field
                    label="Your email"
                    type="email"
                    value={c.email}
                    onChange={c.setEmail}
                    error={c.fields.email}
                    autoComplete="email"
                    inputMode="email"
                    hint="So we can reply."
                    required
                    disabled={sending}
                  />
                  <div className="sm:col-span-2">
                    <TextArea
                      label="Message"
                      value={c.message}
                      onChange={c.setMessage}
                      error={c.fields.message}
                      rows={6}
                      maxLength={3000}
                      placeholder="Write whatever is on your mind. A real person reads every message."
                      required
                      disabled={sending}
                    />
                  </div>
                </div>

                {c.error && (
                  <Alert tone="error" className="mt-6">
                    {c.error}
                  </Alert>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex items-center gap-2.5 rounded-full bg-gold px-7 py-3 text-[0.95rem] font-semibold text-forest-950 transition-colors duration-300 hover:bg-gold-dark disabled:opacity-60"
                  >
                    {sending && <Spinner className="h-4 w-4" />}
                    {sending ? "Sending…" : "Send"}
                  </button>
                  <p className="text-[0.8rem] text-ink/50">
                    We&apos;ll email you a code first, to confirm the address is yours.
                  </p>
                </div>

                {/* for people who would rather use their own mail */}
                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-forest-800/10 pt-5 text-[0.85rem] text-ink/55">
                  <span>Or use your own:</span>
                  <a
                    href={gmail}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-draw font-medium text-forest-800"
                  >
                    Gmail
                  </a>
                  <a href={`mailto:${site.email}`} className="link-draw font-medium text-forest-800">
                    Mail app
                  </a>
                  <button
                    type="button"
                    onClick={copy}
                    className="link-draw font-medium text-forest-800"
                    aria-live="polite"
                  >
                    {copied ? "Copied" : "Copy address"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
