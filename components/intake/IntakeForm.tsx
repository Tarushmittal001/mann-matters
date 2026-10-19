"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { Field, Select, TextArea } from "@/components/ui/Field";
import { Alert, Spinner } from "@/components/ui/Feedback";
import {
  DURATION_OPTIONS,
  RISK,
  RISK_OPTIONS,
  type IntakeInput,
} from "@/lib/intake";
import { cn } from "@/lib/utils";

/**
 * The intake form, in four unhurried sections.
 *
 * Two things about how it is written. The risk question is asked plainly and
 * without euphemism, because a question people can misread is a question that
 * gets the comfortable answer; and whatever they choose, the crisis numbers
 * appear beside it rather than as a scolding after they submit.
 *
 * Saving is one round trip and everything comes back into the field it
 * belongs to — a clinical form that loses your answers is a form you fill in
 * once and never again.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export default function IntakeForm({
  initial,
  minor,
  savedAt,
}: {
  initial: IntakeInput;
  minor: boolean;
  savedAt: string | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<IntakeInput>(initial);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof IntakeInput>(key: K, value: IntakeInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFields((e) => (e[key as string] ? { ...e, [key]: "" } : e));
    setSaved(false);
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(true);
        router.refresh();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (res.status === 422 && data.fields) {
        setFields(data.fields);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(data.error ?? "We couldn't save that. Please try again.");
      }
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const hasErrors = Object.values(fields).some(Boolean);

  return (
    <div className="mx-auto w-full max-w-2xl">
      {saved && (
        <Alert tone="success" className="mb-8" title="Saved.">
          Your therapist will read this before you meet. You can come back and change it any time.
        </Alert>
      )}
      {hasErrors && (
        <Alert tone="error" className="mb-8" title="A few things to fix.">
          They&apos;re marked below.
        </Alert>
      )}
      {error && (
        <Alert tone="error" className="mb-8">
          {error}
        </Alert>
      )}

      <div className="space-y-10">
        {/* ── why you're here ─────────────────────────────────────────────── */}
        <Section title="What brings you here" step={1}>
          <TextArea
            label="In your own words, what's going on?"
            required
            value={form.reason}
            onChange={(v) => set("reason", v)}
            rows={5}
            maxLength={2000}
            error={fields.reason}
            placeholder="There's no right way to write this. Whatever made you book is the right place to start."
          />
          <Select
            label="How long has this been going on?"
            value={form.duration}
            onChange={(v) => set("duration", v)}
            options={DURATION_OPTIONS as unknown as string[]}
            placeholder="Choose…"
          />
        </Section>

        {/* ── history ─────────────────────────────────────────────────────── */}
        <Section title="What's been tried" step={2}>
          <TextArea
            label="Have you had therapy or psychiatric care before?"
            value={form.pastCare}
            onChange={(v) => set("pastCare", v)}
            rows={3}
            maxLength={1500}
            placeholder="When, roughly, and whether it helped. 'No' is a complete answer."
            hint="Knowing what didn't work is as useful as knowing what did."
          />
          <TextArea
            label="Are you taking any medication?"
            value={form.medication}
            onChange={(v) => set("medication", v)}
            rows={3}
            maxLength={1000}
            placeholder="Anything at all, including things not prescribed to you."
            hint="This is confidential and it is not a test. Some medication changes what therapy should look like."
          />
          <TextArea
            label="Anything about your physical health we should know?"
            value={form.medical}
            onChange={(v) => set("medical", v)}
            rows={3}
            maxLength={1000}
            placeholder="Thyroid, sleep apnoea, a recent illness, a pregnancy, chronic pain…"
          />
        </Section>

        {/* ── safety ──────────────────────────────────────────────────────── */}
        <Section title="Keeping you safe" step={3}>
          <div>
            <p className="mb-2.5 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-ink/70">
              Have you had thoughts of harming yourself?
            </p>
            <div className="flex flex-col gap-2" role="radiogroup" aria-label="Thoughts of self-harm">
              {RISK_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={form.riskSelfHarm === o.value}
                  onClick={() => set("riskSelfHarm", o.value)}
                  className={cn(
                    "press rounded-xl border px-4 py-3 text-left text-[0.95rem] transition-colors",
                    form.riskSelfHarm === o.value
                      ? "border-forest-800 bg-forest-800 text-ivory"
                      : "border-forest-800/15 bg-ivory-light text-forest-900 hover:border-forest-800/40"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {fields.riskSelfHarm && (
              <p className="mt-1.5 text-[0.82rem] text-red-700">{fields.riskSelfHarm}</p>
            )}

            <motion.p
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="mt-3 rounded-xl border border-forest-800/10 bg-sage-light/30 px-4 py-3 text-[0.85rem] leading-relaxed text-ink/70"
            >
              {form.riskSelfHarm === RISK.recent
                ? "Thank you for saying so — it is the hardest box on this page to tick. Your therapist will start here. If it becomes urgent before then, call Tele-MANAS on 14416, free and 24x7, or 112 if you are in immediate danger."
                : "Answering honestly changes what your therapist does first. Nobody is going to react badly to it, and nothing here is passed on to your family or employer."}
            </motion.p>
          </div>

          <TextArea
            label="Anything you want to add about that"
            value={form.riskNote}
            onChange={(v) => set("riskNote", v)}
            rows={3}
            maxLength={1000}
            placeholder="Only if you want to. You can also leave it for the session."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Emergency contact"
              required
              value={form.emergencyName}
              onChange={(v) => set("emergencyName", v)}
              placeholder="Their name"
              autoComplete="off"
              error={fields.emergencyName}
            />
            <Field
              label="Their number"
              required
              value={form.emergencyPhone}
              onChange={(v) => set("emergencyPhone", v)}
              placeholder="+91 98765 43210"
              inputMode="tel"
              autoComplete="off"
              error={fields.emergencyPhone}
            />
          </div>
          <Field
            label="Who they are to you"
            value={form.emergencyRelation}
            onChange={(v) => set("emergencyRelation", v)}
            placeholder="Sister, flatmate, friend…"
            autoComplete="off"
            hint="We would only ever call them if you were in danger. Not for appointments, not for anything else."
          />
        </Section>

        {/* ── guardian, for under-18s ─────────────────────────────────────── */}
        {minor && (
          <Section title="Parent or guardian" step={4}>
            <p className="-mt-2 text-[0.9rem] leading-relaxed text-ink/65">
              You&apos;re under 18, so a parent or guardian needs to know about and agree to these
              sessions. Your therapist will confirm it with them before you start. What you talk
              about in the session stays between you and your therapist — the consent is about the
              sessions happening, not about what is said in them.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Their name"
                required
                value={form.guardianName}
                onChange={(v) => set("guardianName", v)}
                placeholder="Parent or guardian"
                autoComplete="off"
                error={fields.guardianName}
              />
              <Field
                label="Their number"
                required
                value={form.guardianPhone}
                onChange={(v) => set("guardianPhone", v)}
                placeholder="+91 98765 43210"
                inputMode="tel"
                autoComplete="off"
                error={fields.guardianPhone}
              />
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-forest-800/15 bg-ivory-light p-4">
              <input
                type="checkbox"
                checked={form.guardianConsent}
                onChange={(e) => set("guardianConsent", e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[#C8A45D]"
              />
              <span className="text-[0.92rem] leading-relaxed text-forest-900">
                My parent or guardian knows about these sessions and agrees to them.
              </span>
            </label>
            {fields.guardianConsent && (
              <p className="text-[0.82rem] text-red-700">{fields.guardianConsent}</p>
            )}
          </Section>
        )}

        {/* ── anything else ───────────────────────────────────────────────── */}
        <Section title="Anything else" step={minor ? 5 : 4}>
          <TextArea
            label="Something you want them to know, but would rather not be asked about"
            value={form.notes}
            onChange={(v) => set("notes", v)}
            rows={4}
            maxLength={2000}
            placeholder="Optional. Some things are easier to write than to say out loud, and your therapist will have read this before you meet."
          />
        </Section>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-5 border-t border-forest-800/10 pt-8">
        <Button onClick={submit} variant="gold" disabled={busy}>
          {busy ? <Spinner label="Saving…" /> : savedAt ? "Save changes" : "Save and send"}
        </Button>
        {savedAt && !saved && (
          <p className="text-[0.85rem] text-ink/70">Last saved {savedAt}.</p>
        )}
      </div>

      <p className="mt-8 text-[0.8rem] leading-relaxed text-ink/70">
        This goes to the therapist you booked and to nobody else. Our admin team cannot read it.
        You can change or empty any answer whenever you like.
      </p>
    </div>
  );
}

function Section({
  title,
  step,
  children,
}: {
  title: string;
  step: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-[0.9rem] text-gold">{String(step).padStart(2, "0")}</span>
        <h2 className="font-display text-xl font-medium text-forest-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}
