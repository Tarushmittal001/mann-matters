"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Form controls that carry their own label, hint, and error wiring.
 *
 * The accessibility contract lives here so no form has to remember it: the
 * label is bound to the control, the hint and error are announced through
 * `aria-describedby`, and an invalid field is marked `aria-invalid` — which is
 * what a screen reader uses to say "this one needs fixing", not the red border.
 */

const base =
  "w-full rounded-xl border bg-ivory-light px-4 py-3 text-[0.95rem] text-forest-900 placeholder:text-ink/35 transition-colors duration-300 focus:outline-none disabled:opacity-60";

const tone = (invalid?: boolean) =>
  invalid
    ? "border-red-300 focus:border-red-500"
    : "border-forest-800/15 focus:border-forest-800";

type Shared = {
  label: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
};

function Shell({
  label,
  error,
  hint,
  required,
  id,
  hintId,
  errorId,
  children,
}: Shared & { id: string; hintId: string; errorId: string; children: ReactNode }) {
  return (
    <div className={cn("w-full")}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-ink/55"
      >
        {label}
        {!required && <span className="ml-1.5 normal-case tracking-normal text-ink/35">optional</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-[0.8rem] leading-relaxed text-ink/50">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-[0.82rem] text-red-700">
          <svg viewBox="0 0 16 16" className="mt-[3px] h-3.5 w-3.5 shrink-0 fill-red-600" aria-hidden="true">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 3a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 7.5A.9.9 0 1 1 8 9.7a.9.9 0 0 1 0 1.8Z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export function Field({
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
  disabled,
  ...shared
}: Shared & {
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "email" | "password" | "tel";
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  maxLength?: number;
  disabled?: boolean;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  // a password box gets an eye: mistyping a password you can't see is the
  // commonest reason a correct password "doesn't work"
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";

  return (
    <Shell {...shared} id={id} hintId={hintId} errorId={errorId}>
      <div className={isPassword ? "relative" : undefined}>
      <input
        id={id}
        type={isPassword && shown ? "text" : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={shared.error ? true : undefined}
        aria-describedby={shared.error ? errorId : shared.hint ? hintId : undefined}
        className={cn(base, tone(!!shared.error), isPassword && "pr-12", shared.className)}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          disabled={disabled}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          className="absolute right-1 top-1/2 flex h-9 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-ink/45 transition-colors hover:text-forest-800 disabled:opacity-50"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
            {!shown && <path d="M3 3l18 18" />}
          </svg>
        </button>
      )}
      </div>
    </Shell>
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength,
  disabled,
  ...shared
}: Shared & {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <Shell {...shared} id={id} hintId={hintId} errorId={errorId}>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={shared.error ? true : undefined}
        aria-describedby={shared.error ? errorId : shared.hint ? hintId : undefined}
        className={cn(base, "resize-y leading-relaxed", tone(!!shared.error), shared.className)}
      />
    </Shell>
  );
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  ...shared
}: Shared & {
  value: string;
  onChange: (v: string) => void;
  /** Plain strings when the text is the value, or pairs when it isn't (e.g. gender). */
  options: readonly (string | { value: string; label: string })[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <Shell {...shared} id={id} hintId={hintId} errorId={errorId}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={shared.error ? true : undefined}
        aria-describedby={shared.error ? errorId : shared.hint ? hintId : undefined}
        className={cn(base, tone(!!shared.error), "appearance-none", shared.className)}
      >
        <option value="">{placeholder ?? "Choose…"}</option>
        {options.map((o) => {
          const opt = typeof o === "string" ? { value: o, label: o } : o;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </Shell>
  );
}
