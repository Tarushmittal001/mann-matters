"use client";

import { Field } from "@/components/ui/Field";

export type Guardian = { name: string; phone: string; consent: boolean };

export const EMPTY_GUARDIAN: Guardian = { name: "", phone: "", consent: false };

/** Loose on purpose: Indian numbers with or without +91, spaces and dashes. */
export const guardianPhoneOk = (v: string) => /^[+]?[0-9 ()-]{8,18}$/.test(v.trim());

export function guardianReady(g: Guardian): boolean {
  return !!g.name.trim() && guardianPhoneOk(g.phone) && g.consent;
}

/**
 * Consent, for a client under 18.
 *
 * It sits on the review screen rather than in a modal, because a consent box
 * somebody has to dismiss to get on with booking is a consent box nobody
 * reads. The wording draws the line explicitly: the guardian agrees to the
 * sessions happening, and is not thereby entitled to what is said in them. A
 * teenager who thinks their parent gets a transcript will not say anything
 * worth saying.
 */
export default function GuardianConsent({
  value,
  onChange,
  errors,
  disabled,
}: {
  value: Guardian;
  onChange: (g: Guardian) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}) {
  const set = <K extends keyof Guardian>(key: K, v: Guardian[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <section className="mt-7 rounded-2xl border border-forest-800/12 bg-sage-light/25 p-5 sm:p-6">
      <p className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-forest-700">
        Parent or guardian
      </p>
      <p className="mt-2 text-[0.9rem] leading-relaxed text-ink/70">
        You&apos;re under 18, so a parent or guardian needs to know about these sessions and agree
        to them. Your therapist will confirm it with them by phone before the first session.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field
          label="Their name"
          required
          value={value.name}
          onChange={(v) => set("name", v)}
          placeholder="Parent or guardian"
          autoComplete="off"
          disabled={disabled}
          error={errors.guardianName}
        />
        <Field
          label="Their number"
          required
          value={value.phone}
          onChange={(v) => set("phone", v)}
          placeholder="+91 98765 43210"
          inputMode="tel"
          autoComplete="off"
          disabled={disabled}
          error={errors.guardianPhone}
        />
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-forest-800/15 bg-ivory-light p-4">
        <input
          type="checkbox"
          checked={value.consent}
          disabled={disabled}
          onChange={(e) => set("consent", e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#C8A45D]"
        />
        <span className="text-[0.92rem] leading-relaxed text-forest-900">
          My parent or guardian knows about these sessions and agrees to them.
        </span>
      </label>
      {errors.guardianConsent && (
        <p className="mt-1.5 text-[0.82rem] text-red-700">{errors.guardianConsent}</p>
      )}

      <p className="mt-4 text-[0.8rem] leading-relaxed text-ink/70">
        They are agreeing to the sessions happening. What you talk about stays between you and your
        therapist — your parent does not get notes, recordings or a summary. The only exception is
        the one that applies to everybody: if your therapist believes you are in danger.
      </p>
    </section>
  );
}
