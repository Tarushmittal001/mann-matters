"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Portal from "@/components/ui/Portal";
import { Field } from "@/components/ui/Field";
import { Alert, Spinner } from "@/components/ui/Feedback";
import type { ExpertRow } from "@/components/admin/ExpertManager";

/**
 * Who can sign in as a listing.
 *
 * There is nowhere on this screen to type a password, and that is the design.
 * An admin who sets a colleague's password knows it, and in practice sends it
 * over WhatsApp, where it stays legible for as long as the chat does. Here the
 * admin names an inbox and the practitioner turns it into an account; what the
 * admin can do afterwards is send the link again, or take the access away.
 *
 * The states this shows are the ones an admin needs to tell apart:
 *   none        — nobody can sign in. The listing is bookable and the person it
 *                 names cannot see a single booking.
 *   unconfirmed — an account exists on an address nobody has ever written to.
 *                 Seeded accounts land here, and so does anyone whose address
 *                 was changed underneath them: a reset sent there can go
 *                 nowhere and nothing on this screen would say so.
 *   invited     — a live link is out, unspent. Normal for a day; odd after a week.
 *   active      — they chose a password and have been in.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export default function ExpertAccessDialog({
  row,
  onClose,
  onDone,
}: {
  row: ExpertRow;
  onClose: () => void;
  /** Re-reads the page so the card's status chip catches up. */
  onDone: () => void;
}) {
  const [email, setEmail] = useState(row.access.email);
  const [busy, setBusy] = useState<"send" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ email: string; delivered: boolean; devLink?: string } | null>(
    null
  );
  const linked = row.access.state !== "none";

  const send = async () => {
    setBusy("send");
    setError(null);
    try {
      const res = await fetch(`/api/admin/experts/${row.id}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.fields?.email ?? data.error ?? "That didn't work. Please try again.");
        return;
      }
      setSent({ email: data.email, delivered: data.delivered, devLink: data.devLink });
      onDone();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    const ok = window.confirm(
      `Remove ${row.access.email} from ${row.name}? They are signed out straight away. The listing stays on the site and past sessions are untouched.`
    );
    if (!ok) return;
    setBusy("remove");
    setError(null);
    try {
      const res = await fetch(`/api/admin/experts/${row.id}/access`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't remove that login.");
        return;
      }
      onDone();
      onClose();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Portal>
      <motion.div
        className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0 bg-forest-950/45 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Login access for ${row.name}`}
          className="relative w-full max-w-lg overflow-hidden rounded-t-3xl bg-ivory-light shadow-bloom sm:rounded-3xl"
          initial={{ y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <div className="flex items-start justify-between gap-4 border-b border-forest-800/10 px-6 py-5 sm:px-8">
            <div>
              <p className="eyebrow mb-2">practitioner login</p>
              <h2 className="font-display text-2xl font-medium text-forest-900">{row.name}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-1 rounded-full p-2 text-ink/70 transition-colors hover:bg-forest-800/5 hover:text-forest-900"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-6 sm:px-8">
            {sent ? (
              <>
                <p className="font-display text-lg text-forest-900">
                  {sent.delivered ? "Invite sent." : "Account created — but nothing was emailed."}
                </p>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-ink/65">
                  {sent.delivered ? (
                    <>
                      {sent.email} has a link to choose their own password. It works once and runs out
                      in 48 hours. Neither you nor we ever see what they pick.
                    </>
                  ) : (
                    <>
                      No mail provider accepted the message, so nothing has reached {sent.email}. The
                      account exists and the link is live — send it to them another way, or set up
                      email and use Resend invite.
                    </>
                  )}
                </p>
                {sent.devLink && (
                  <p className="mt-4 break-all rounded-xl bg-forest-800/5 p-3 font-mono text-[0.75rem] text-forest-800">
                    {sent.devLink}
                  </p>
                )}
                <div className="mt-7">
                  <button
                    type="button"
                    onClick={onClose}
                    className="press rounded-full bg-forest-800 px-6 py-2.5 text-sm font-semibold text-ivory"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[0.92rem] leading-relaxed text-ink/65">
                  {linked ? (
                    <>
                      {row.name} signs in as{" "}
                      <strong className="text-forest-800">{row.access.email}</strong>
                      {row.access.state === "invited" &&
                        " — invited, but they have not set a password yet."}
                      {row.access.state === "unconfirmed" &&
                        " — but nobody has ever confirmed that address, so a password reset may go nowhere. Send an invite to prove it works."}
                      {row.access.state === "active" && "."}
                    </>
                  ) : (
                    <>
                      Nobody can sign in as this listing, so {row.name} cannot see the sessions
                      clients book with them. Give us their email and we will send a link to set
                      their own password.
                    </>
                  )}
                </p>

                <div className="mt-5">
                  <Field
                    label="Their email"
                    required
                    type="email"
                    value={email}
                    onChange={setEmail}
                    disabled={!!busy || linked}
                    placeholder="ananya@emoraa.com"
                    hint={
                      linked
                        ? "To move this to a different address, remove the login and invite the new one."
                        : "This becomes their username, and it cannot be changed here afterwards."
                    }
                  />
                </div>

                {error && (
                  <Alert tone="error" className="mt-5">
                    {error}
                  </Alert>
                )}

                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={send}
                    disabled={!!busy || !email.trim()}
                    className="press inline-flex items-center gap-2.5 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-forest-950 transition-colors hover:bg-gold-dark disabled:opacity-60"
                  >
                    {busy === "send" && <Spinner className="h-4 w-4" />}
                    {busy === "send" ? "Sending…" : linked ? "Resend invite" : "Send invite"}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={!!busy}
                    className="link-draw text-sm font-medium text-forest-800"
                  >
                    Cancel
                  </button>
                  {linked && (
                    <button
                      type="button"
                      onClick={remove}
                      disabled={!!busy}
                      className="ml-auto link-draw text-sm font-medium text-red-700 disabled:opacity-60"
                    >
                      {busy === "remove" ? "Removing…" : "Remove access"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </Portal>
  );
}
