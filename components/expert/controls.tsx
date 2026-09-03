"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* Form controls for the portal. Everything here is a real input, button,
   fieldset or dialog: nothing is a div pretending. Focus styling comes from
   the global :focus-visible ring, so tab order is always visible. */

const fieldBase =
  "w-full rounded-xl border bg-ivory px-3.5 py-2.5 text-[0.94rem] text-forest-900 transition-colors placeholder:text-ink/35 focus:outline-none disabled:cursor-not-allowed disabled:bg-forest-800/[0.04] disabled:text-ink/50";

function fieldTone(invalid?: boolean) {
  return invalid
    ? "border-red-400 focus:border-red-500"
    : "border-forest-800/15 focus:border-forest-700";
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
  counter,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  children: (props: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
  counter?: ReactNode;
}) {
  const id = useId();
  const hintId = hint ? id + "-hint" : undefined;
  const errorId = error ? id + "-error" : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[0.86rem] font-semibold text-forest-900">
          {label}
          {required && (
            <span className="ml-1 text-kesar" aria-hidden="true">
              *
            </span>
          )}
          {!required && <span className="ml-2 text-[0.75rem] font-normal text-ink/45">optional</span>}
        </label>
        {counter && <span className="text-[0.75rem] tabular-nums text-ink/45">{counter}</span>}
      </div>
      {hint && (
        <p id={hintId} className="mb-2 mt-1 text-[0.82rem] leading-snug text-ink/60">
          {hint}
        </p>
      )}
      <div className={cn(!hint && "mt-1.5")}>
        {children({ id, describedBy, invalid: Boolean(error) })}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 flex items-center gap-1.5 text-[0.82rem] font-medium text-red-700">
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.8" />
            <path d="M10 6v5m0 2.8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export function TextInput({
  invalid,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      className={cn(fieldBase, fieldTone(invalid), className)}
    />
  );
}

export function TextArea({
  invalid,
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      {...rest}
      aria-invalid={invalid || undefined}
      className={cn(fieldBase, fieldTone(invalid), "leading-relaxed", className)}
    />
  );
}

export function Select({
  invalid,
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      {...rest}
      aria-invalid={invalid || undefined}
      className={cn(fieldBase, fieldTone(invalid), "appearance-none pr-9", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2 4.5 6 8.5l4-4' stroke='%230E3B33' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.9rem center",
      }}
    >
      {children}
    </select>
  );
}

/** An actual checkbox styled as a switch, so it works with the keyboard for free. */
export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-5 py-3.5">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className={cn(
            "text-[0.92rem] font-medium",
            disabled ? "text-ink/45" : "cursor-pointer text-forest-900"
          )}
        >
          {label}
        </label>
        {hint && <p className="mt-0.5 text-[0.82rem] leading-snug text-ink/60">{hint}</p>}
      </div>
      <span className="relative mt-0.5 shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span
          aria-hidden="true"
          className={cn(
            "flex h-6 w-11 items-center rounded-full p-0.5 transition-colors duration-300 ease-silk peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold",
            checked ? "bg-forest-700" : "bg-forest-800/20",
            disabled && "opacity-50"
          )}
        >
          <span
            className={cn(
              "h-5 w-5 rounded-full bg-ivory-light shadow-sm transition-transform duration-300 ease-silk",
              checked && "translate-x-5"
            )}
          />
        </span>
      </span>
    </div>
  );
}

/** Multi-select as chips. Rendered as checkboxes inside a fieldset. */
export function ChipGroup({
  legend,
  hint,
  options,
  selected,
  onToggle,
  max,
  error,
}: {
  legend: string;
  hint?: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  max?: number;
  error?: string | null;
}) {
  const atMax = max !== undefined && selected.length >= max;
  return (
    <fieldset>
      <div className="flex items-baseline justify-between gap-3">
        <legend className="text-[0.86rem] font-semibold text-forest-900">{legend}</legend>
        {max !== undefined && (
          <span className="text-[0.75rem] tabular-nums text-ink/45">
            {selected.length} / {max}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-[0.82rem] leading-snug text-ink/60">{hint}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const on = selected.includes(option);
          const blocked = !on && atMax;
          return (
            <label
              key={option}
              className={cn(
                "relative inline-flex cursor-pointer items-center rounded-full border px-3.5 py-1.5 text-[0.85rem] font-medium transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold",
                on
                  ? "border-forest-700 bg-forest-800 text-ivory"
                  : "border-forest-800/15 bg-ivory text-forest-900 hover:border-forest-800/40",
                blocked && "cursor-not-allowed opacity-45 hover:border-forest-800/15"
              )}
            >
              <input
                type="checkbox"
                checked={on}
                disabled={blocked}
                onChange={() => onToggle(option)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
              {option}
            </label>
          );
        })}
      </div>
      {error && (
        <p className="mt-2 text-[0.82rem] font-medium text-red-700" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

type ButtonTone = "primary" | "secondary" | "ghost" | "danger";

const buttonTones: Record<ButtonTone, string> = {
  primary: "bg-forest-800 text-ivory hover:bg-forest-700",
  secondary: "border border-forest-800/20 bg-ivory text-forest-800 hover:border-forest-800/45",
  ghost: "text-forest-800 hover:bg-forest-800/[0.06]",
  danger: "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
};

export function ActionButton({
  children,
  onClick,
  tone = "primary",
  busy,
  disabled,
  type = "button",
  size = "md",
  className,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: ButtonTone;
  busy?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-300 ease-silk disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-4 py-2 text-[0.84rem]" : "px-5 py-2.5 text-[0.9rem]",
        buttonTones[tone],
        className
      )}
    >
      {busy && (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}

/**
 * The footer every editable panel ends with: what changed, when it last saved,
 * and a way back. Sticky on small screens so a long form never hides its own
 * save button.
 */
export function SaveBar({
  dirty,
  busy,
  savedAt,
  onSave,
  onReset,
  saveLabel = "Save changes",
  disabled,
}: {
  dirty: boolean;
  busy?: boolean;
  savedAt?: string | null;
  onSave: () => void;
  onReset?: () => void;
  saveLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-b-2xl border-t border-forest-800/10 bg-ivory-light/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:px-6">
      <p className="text-[0.84rem] text-ink/60" aria-live="polite">
        {dirty ? (
          <span className="font-medium text-haldi-ink">Unsaved changes</span>
        ) : savedAt ? (
          <>Saved at {savedAt}</>
        ) : (
          <>Everything here is up to date.</>
        )}
      </p>
      <div className="flex items-center gap-3">
        {onReset && (
          <ActionButton tone="ghost" size="sm" onClick={onReset} disabled={!dirty || busy}>
            Discard
          </ActionButton>
        )}
        <ActionButton onClick={onSave} busy={busy} disabled={!dirty || disabled}>
          {saveLabel}
        </ActionButton>
      </div>
    </div>
  );
}

/**
 * Confirmation dialog for anything a practitioner cannot undo. Focus moves in
 * on open, is trapped while open, returns to the trigger on close, and Escape
 * always gets you out.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = "Keep as is",
  tone = "primary",
  busy,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ButtonTone;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.documentElement.style.overflow = previousOverflow;
      restoreTo.current?.focus?.();
    };
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[75] flex items-end justify-center bg-forest-950/45 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onCancel();
          }}
        >
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg rounded-2xl border border-forest-800/10 bg-ivory-light p-6 shadow-bloom"
          >
            <h2 id={titleId} className="font-display text-xl font-medium text-forest-900">
              {title}
            </h2>
            <div className="mt-2 space-y-3 text-[0.9rem] leading-relaxed text-ink/75">{body}</div>
            {children && <div className="mt-5">{children}</div>}
            <div className="mt-7 flex flex-wrap justify-end gap-3">
              <ActionButton tone="secondary" onClick={onCancel} disabled={busy}>
                {cancelLabel}
              </ActionButton>
              <ActionButton tone={tone} onClick={onConfirm} busy={busy}>
                {confirmLabel}
              </ActionButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Copy-to-clipboard with its own inline confirmation. */
export function CopyButton({ value, label = "Copy link" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2400);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <ActionButton
      tone="secondary"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
    >
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </ActionButton>
  );
}
