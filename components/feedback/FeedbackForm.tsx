"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { TextArea, Field } from "@/components/ui/Field";
import { Alert, Spinner } from "@/components/ui/Feedback";
import {
  FEEDBACK_DETAIL_MAX,
  FEEDBACK_QUOTE_MAX,
  FEEDBACK_QUOTE_MIN,
  FEEDBACK_STATUS,
  publicName,
  validateFeedback,
  type FeedbackAvatar,
  type NameStyle,
} from "@/lib/feedback";
import { cn } from "@/lib/utils";

export type SavedFeedback = {
  quote: string;
  avatar: string;
  nameStyle: string;
  detail: string | null;
  status: string;
};

const STATUS_NOTE: Record<string, { tone: "info" | "success" | "warning"; text: string }> = {
  [FEEDBACK_STATUS.pending]: {
    tone: "info",
    text: "Thank you. Your story is waiting for a quick review before it appears on the home page.",
  },
  [FEEDBACK_STATUS.approved]: {
    tone: "success",
    text: "Your story is live on the home page. Editing it will send it back for a quick review.",
  },
  [FEEDBACK_STATUS.hidden]: {
    tone: "warning",
    text: "Your story isn't shown on the home page right now. You can edit it and send it again.",
  },
};

export default function FeedbackForm({
  fullName,
  initial,
  avatars,
}: {
  fullName: string;
  initial: SavedFeedback | null;
  avatars: FeedbackAvatar[];
}) {
  const reduced = useReducedMotion();
  const [avatar, setAvatar] = useState(initial?.avatar ?? "");
  const [quote, setQuote] = useState(initial?.quote ?? "");
  const [nameStyle, setNameStyle] = useState<NameStyle>(initial?.nameStyle === "initial" ? "initial" : "first");
  const [detail, setDetail] = useState(initial?.detail ?? "");
  const [saved, setSaved] = useState<SavedFeedback | null>(initial);

  const [fields, setFields] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "deleting">("idle");
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const busy = status !== "idle";
  // an error goes away as soon as that field is touched again
  const clear = (key: string) => setFields((f) => (f[key] ? { ...f, [key]: "" } : f));
  const name = publicName(fullName, nameStyle);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const local = validateFeedback({ quote, avatar, nameStyle, detail }, avatars);
    setFields(local);
    if (Object.keys(local).length) return;

    setStatus("saving");
    setError(null);
    setJustSaved(false);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote, avatar, nameStyle, detail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 422 && data.fields) setFields(data.fields);
        else setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSaved(data.feedback);
      setJustSaved(true);
    } catch {
      setError("Couldn't reach the server. Please check your connection and try again.");
    } finally {
      setStatus("idle");
    }
  };

  const onDelete = async () => {
    if (!window.confirm("Remove your story? It will disappear from the home page.")) return;
    setStatus("deleting");
    setError(null);
    try {
      const res = await fetch("/api/feedback", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSaved(null);
      setJustSaved(false);
      setQuote("");
      setDetail("");
      setAvatar("");
    } catch {
      setError("Couldn't remove it just now. Please try again.");
    } finally {
      setStatus("idle");
    }
  };

  const note = saved ? STATUS_NOTE[saved.status] : null;

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
      <form onSubmit={onSubmit} noValidate className="space-y-10">
        {note && (
          <Alert tone={justSaved && saved?.status === FEEDBACK_STATUS.pending ? "success" : note.tone}>
            {note.text}
          </Alert>
        )}

        {/* 1. portrait */}
        <fieldset>
          <legend className="font-display text-xl font-medium text-forest-900">1. Pick a portrait</legend>
          <p className="mt-1 text-[0.9rem] text-ink/60">
            These stand in for you. No photos, no faces, so your story stays yours.
          </p>
          <div
            className="mt-5 grid grid-cols-4 gap-2.5 sm:grid-cols-6"
            role="radiogroup"
            aria-label="Portrait"
            aria-invalid={fields.avatar ? true : undefined}
          >
            {avatars.map((a) => {
              const on = a.src === avatar;
              return (
                <motion.button
                  key={a.src}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={a.label}
                  onClick={() => {
                    setAvatar(a.src);
                    clear("avatar");
                  }}
                  disabled={busy}
                  whileTap={reduced ? undefined : { scale: 0.94 }}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-2xl border-2 bg-ivory-light p-1.5 transition-colors duration-300",
                    on ? "border-gold bg-gold/10" : "border-transparent hover:border-forest-800/15"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.src} alt="" className="h-full w-full object-contain object-bottom" draggable={false} />
                  <AnimatePresence>
                    {on && (
                      <motion.span
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 420, damping: 18 }}
                        aria-hidden="true"
                      >
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6.2 5 8.5l4.5-5" stroke="#0A2E28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
          {fields.avatar && <p className="mt-2 text-[0.82rem] text-red-700">{fields.avatar}</p>}
        </fieldset>

        {/* 2. words */}
        <fieldset>
          <legend className="font-display text-xl font-medium text-forest-900">2. Your words</legend>
          <p className="mt-1 text-[0.9rem] text-ink/60">
            What changed for you? A sentence or two is plenty. Please leave out other people&apos;s names
            and anything you wouldn&apos;t want a stranger to read.
          </p>
          <div className="mt-4">
            <TextArea
              label="Your feedback"
              value={quote}
              onChange={(v) => {
                setQuote(v);
                clear("quote");
              }}
              error={fields.quote || undefined}
              rows={5}
              maxLength={FEEDBACK_QUOTE_MAX}
              placeholder="I didn't think talking would help, but…"
              required
              disabled={busy}
              hint={`${quote.trim().length}/${FEEDBACK_QUOTE_MAX} · at least ${FEEDBACK_QUOTE_MIN} characters`}
            />
          </div>
        </fieldset>

        {/* 3. name */}
        <fieldset>
          <legend className="font-display text-xl font-medium text-forest-900">3. How your name appears</legend>
          <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Name shown">
            {(["first", "initial"] as const).map((style) => (
              <button
                key={style}
                type="button"
                role="radio"
                aria-checked={nameStyle === style}
                onClick={() => setNameStyle(style)}
                disabled={busy}
                className={cn(
                  "rounded-full border px-4 py-2 text-[0.9rem] font-medium transition-colors",
                  nameStyle === style
                    ? "border-forest-800 bg-forest-800 text-ivory"
                    : "border-forest-800/20 text-forest-800 hover:border-forest-800"
                )}
              >
                {style === "first" ? `First name (${publicName(fullName, "first")})` : `Initial only (${publicName(fullName, "initial")})`}
              </button>
            ))}
          </div>
          <div className="mt-5 max-w-md">
            <Field
              label="A little context"
              value={detail}
              onChange={(v) => {
                setDetail(v);
                clear("detail");
              }}
              error={fields.detail || undefined}
              maxLength={FEEDBACK_DETAIL_MAX}
              placeholder="22, student, Delhi"
              disabled={busy}
              hint="Optional. Age, work or city, only if you're comfortable."
            />
          </div>
        </fieldset>

        {error && <Alert tone="error">{error}</Alert>}

        <div className="flex flex-wrap items-center gap-5 border-t border-forest-800/10 pt-7">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2.5 rounded-full bg-gold px-7 py-3 text-[0.95rem] font-semibold text-forest-950 transition-colors duration-300 hover:bg-gold-dark disabled:opacity-60"
          >
            {status === "saving" && <Spinner className="h-4 w-4" />}
            {status === "saving" ? "Sending…" : saved ? "Update my story" : "Share my story"}
          </button>
          {saved && (
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="link-draw text-sm font-medium text-red-700 disabled:opacity-60"
            >
              {status === "deleting" ? "Removing…" : "Remove my story"}
            </button>
          )}
        </div>
      </form>

      {/* live preview, as it will look on the home page */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <p className="eyebrow mb-4">preview</p>
        <div className="rounded-3xl border border-forest-800/10 bg-sage-light/30 p-7">
          <div className="h-28 w-24">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <motion.img
                key={avatar}
                src={avatar}
                alt=""
                className="h-full w-full object-contain object-bottom"
                initial={reduced ? false : { clipPath: "inset(100% 0% 0% 0%)" }}
                animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
                transition={{ duration: 0.6 }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-forest-800/20 text-center text-[0.7rem] text-ink/45">
                your portrait
              </div>
            )}
          </div>
          <p className="mt-5 font-display text-xl leading-snug text-forest-900">
            {quote.trim() || <span className="text-ink/35">Your words will appear here.</span>}
          </p>
          <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
            <span className="font-display italic text-forest-700">— {name}</span>
            <span className="text-[0.8rem] text-ink/55">{detail.trim() || "Emoraa client"}</span>
          </p>
        </div>
        <p className="mt-4 text-[0.8rem] leading-relaxed text-ink/50">
          We read every story before it goes up, and we never add your surname, email or session details.
        </p>
      </aside>
    </div>
  );
}
