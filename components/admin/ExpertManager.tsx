"use client";

import { useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Portal from "@/components/ui/Portal";
import { Field, Select, TextArea } from "@/components/ui/Field";
import { Alert, Spinner } from "@/components/ui/Feedback";
import {
  EXPERT_LIMITS,
  emptyExpertDraft,
  validateExpert,
  type ExpertDraft,
} from "@/lib/expert-admin";
import { cn, formatINR } from "@/lib/utils";

/**
 * The therapist catalogue, as an admin works with it.
 *
 * Add, edit, reorder, hide or delete. Hiding is the everyday move — it takes
 * someone off the site while their sessions, payments and notes keep meaning
 * something — so it sits on the card, while deleting lives inside the form and
 * is refused by the server for anyone with history.
 */

export type ExpertRow = {
  id: string;
  slug: string;
  name: string;
  credentials: string;
  experienceYears: number;
  languages: string[];
  specialties: string[];
  price: number;
  rating: number;
  photo: string;
  bio: string;
  status: string;
  sortOrder: number;
  bookings: number;
};

const EASE = [0.22, 1, 0.36, 1] as const;

const toDraft = (r: ExpertRow): ExpertDraft => ({
  name: r.name,
  credentials: r.credentials,
  experienceYears: String(r.experienceYears),
  languages: r.languages,
  specialties: r.specialties,
  price: String(r.price),
  rating: String(r.rating),
  photo: r.photo,
  bio: r.bio,
  status: r.status,
  sortOrder: String(r.sortOrder),
});

/** A list of short strings, edited as chips: type, press Enter, click × to drop. */
function ChipInput({
  label,
  values,
  onChange,
  error,
  hint,
  placeholder,
  disabled,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");

  const add = () => {
    const value = text.trim();
    if (!value) return;
    if (!values.includes(value)) onChange([...values, value]);
    setText("");
  };

  return (
    <div>
      <label className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-ink/55">
        {label}
      </label>
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 rounded-xl border bg-ivory-light p-2",
          error ? "border-red-300" : "border-forest-800/15"
        )}
      >
        {values.map((v) => (
          <span
            key={v}
            className="flex items-center gap-1.5 rounded-full bg-sage-light/70 py-1 pl-3 pr-1.5 text-[0.82rem] font-medium text-forest-800"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              disabled={disabled}
              aria-label={`Remove ${v}`}
              className="grid h-5 w-5 place-items-center rounded-full text-forest-800/60 transition-colors hover:bg-forest-800/10 hover:text-forest-900"
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          disabled={disabled}
          placeholder={values.length ? "" : placeholder}
          className="min-w-[8rem] flex-1 bg-transparent px-2 py-1 text-[0.95rem] text-forest-900 placeholder:text-ink/35 focus:outline-none"
        />
      </div>
      <p className={cn("mt-1.5 text-[0.8rem]", error ? "text-red-700" : "text-ink/50")}>
        {error ?? hint}
      </p>
    </div>
  );
}

function ExpertForm({
  row,
  onClose,
  onSaved,
}: {
  row: ExpertRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<ExpertDraft>(row ? toDraft(row) : emptyExpertDraft);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);

  const set = <K extends keyof ExpertDraft>(key: K, value: ExpertDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setFields((f) => (f[key as string] ? { ...f, [key as string]: "" } : f));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const local = validateExpert(draft);
    setFields(local);
    if (Object.keys(local).length) return;

    setBusy("save");
    setError(null);
    try {
      const res = await fetch(row ? `/api/admin/experts/${row.id}` : "/api/admin/experts", {
        method: row ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 422 && data.fields) setFields(data.fields);
        else setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      onSaved();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const onDelete = async () => {
    if (!row) return;
    if (!window.confirm(`Delete ${row.name} from the catalogue? This can't be undone.`)) return;
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch(`/api/admin/experts/${row.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't delete this listing.");
        return;
      }
      onSaved();
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
        <div className="absolute inset-0 bg-forest-950/45 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={row ? `Edit ${row.name}` : "Add a therapist"}
          className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-ivory-light shadow-bloom sm:rounded-3xl"
          initial={{ y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <div className="flex items-start justify-between gap-4 border-b border-forest-800/10 px-6 py-5 sm:px-8">
            <div>
              <p className="eyebrow mb-2">{row ? "edit listing" : "new listing"}</p>
              <h2 className="font-display text-2xl font-medium text-forest-900">
                {row ? row.name : "Add a therapist"}
              </h2>
              {row && (
                <p className="mt-1 text-[0.82rem] text-ink/55">
                  Public id <span className="font-mono">{row.slug}</span> · {row.bookings} session
                  {row.bookings === 1 ? "" : "s"} on record
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-1 rounded-full p-2 text-ink/45 transition-colors hover:bg-forest-800/5 hover:text-forest-900"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <form onSubmit={onSubmit} noValidate className="overflow-y-auto overscroll-contain px-6 py-6 sm:px-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label="Name"
                  required
                  value={draft.name}
                  onChange={(v) => set("name", v)}
                  error={fields.name}
                  maxLength={EXPERT_LIMITS.nameMax}
                  placeholder="Ananya Iyer"
                  disabled={!!busy}
                  hint={row ? "The public id stays as it is, so past sessions keep pointing here." : undefined}
                />
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Credentials"
                  value={draft.credentials}
                  onChange={(v) => set("credentials", v)}
                  error={fields.credentials}
                  maxLength={EXPERT_LIMITS.credentialsMax}
                  placeholder="M.Phil. Clinical Psychology, RCI Licensed"
                  disabled={!!busy}
                />
              </div>

              <Field
                label="Years of experience"
                required
                inputMode="numeric"
                value={draft.experienceYears}
                onChange={(v) => set("experienceYears", v.replace(/\D/g, "").slice(0, 2))}
                error={fields.experienceYears}
                placeholder="9"
                disabled={!!busy}
              />
              <Field
                label="Session fee (₹)"
                required
                inputMode="numeric"
                value={draft.price}
                onChange={(v) => set("price", v.replace(/\D/g, "").slice(0, 6))}
                error={fields.price}
                placeholder="1199"
                disabled={!!busy}
              />

              <Field
                label="Rating"
                required
                value={draft.rating}
                onChange={(v) => set("rating", v.replace(/[^\d.]/g, "").slice(0, 3))}
                error={fields.rating}
                placeholder="4.9"
                disabled={!!busy}
                hint="Shown on the card, out of 5."
              />
              <Select
                label="Shown on the site"
                required
                value={draft.status}
                onChange={(v) => set("status", v)}
                options={[
                  { value: "ACTIVE", label: "Listed — bookable" },
                  { value: "HIDDEN", label: "Hidden — off the site" },
                ]}
                error={fields.status}
                disabled={!!busy}
              />

              <div className="sm:col-span-2">
                <ChipInput
                  label="Languages"
                  values={draft.languages}
                  onChange={(v) => set("languages", v)}
                  error={fields.languages}
                  hint="Type one and press Enter. These drive language matching."
                  placeholder="English, Hindi, Tamil…"
                  disabled={!!busy}
                />
              </div>
              <div className="sm:col-span-2">
                <ChipInput
                  label="Specialities"
                  values={draft.specialties}
                  onChange={(v) => set("specialties", v)}
                  error={fields.specialties}
                  hint="What this therapist works on. Matching reads these words."
                  placeholder="Anxiety, Workplace stress…"
                  disabled={!!busy}
                />
              </div>

              <div className="sm:col-span-2">
                <Field
                  label="Photo address"
                  required
                  value={draft.photo}
                  onChange={(v) => set("photo", v)}
                  error={fields.photo}
                  placeholder="https://… or /experts/ananya.jpg"
                  disabled={!!busy}
                  hint="A portrait, roughly square. Files in /public work as /experts/name.jpg."
                />
                {draft.photo.trim() && !fields.photo && (
                  <div className="mt-3 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={draft.photo.trim()}
                      alt=""
                      className="h-16 w-16 rounded-xl object-cover"
                      onError={(e) => ((e.currentTarget.style.opacity = "0.15"))}
                    />
                    <span className="text-[0.8rem] text-ink/55">Preview</span>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <TextArea
                  label="Short bio"
                  value={draft.bio}
                  onChange={(v) => set("bio", v)}
                  error={fields.bio}
                  rows={3}
                  maxLength={EXPERT_LIMITS.bioMax}
                  disabled={!!busy}
                  hint="Optional, for when a fuller profile is shown."
                />
              </div>

              <Field
                label="Order on the site"
                value={draft.sortOrder}
                onChange={(v) => set("sortOrder", v.replace(/\D/g, "").slice(0, 3))}
                error={fields.sortOrder}
                disabled={!!busy}
                hint="Lower numbers appear first."
              />
            </div>

            {error && (
              <Alert tone="error" className="mt-6">
                {error}
              </Alert>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-forest-800/10 pt-6">
              <button
                type="submit"
                disabled={!!busy}
                className="inline-flex items-center gap-2.5 rounded-full bg-gold px-7 py-3 text-[0.95rem] font-semibold text-forest-950 transition-colors hover:bg-gold-dark disabled:opacity-60"
              >
                {busy === "save" && <Spinner className="h-4 w-4" />}
                {busy === "save" ? "Saving…" : row ? "Save changes" : "Add therapist"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={!!busy}
                className="link-draw text-sm font-medium text-forest-800"
              >
                Cancel
              </button>
              {row && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={!!busy}
                  className="ml-auto link-draw text-sm font-medium text-red-700 disabled:opacity-60"
                >
                  {busy === "delete" ? "Deleting…" : "Delete listing"}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </motion.div>
    </Portal>
  );
}

export default function ExpertManager({ rows }: { rows: ExpertRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ExpertRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.name, r.credentials, ...r.languages, ...r.specialties].join(" ").toLowerCase().includes(q)
    );
  }, [rows, query]);

  const listed = rows.filter((r) => r.status === "ACTIVE").length;

  /** Save one field without opening the form: the hide toggle and the arrows. */
  const patch = async (row: ExpertRow, changes: Partial<ExpertDraft>) => {
    setBusyId(row.id);
    setNote(null);
    try {
      const res = await fetch(`/api/admin/experts/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...toDraft(row), ...changes }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setNote(data.error ?? "That didn't save.");
        return;
      }
      router.refresh();
    } catch {
      setNote("Couldn't reach the server.");
    } finally {
      setBusyId(null);
    }
  };

  /**
   * Swap two neighbours. Positions are renumbered from the top first: the
   * seeded rows can share a number, and copying a neighbour's value would then
   * leave two people tied and the arrow doing nothing.
   */
  const move = async (row: ExpertRow, direction: -1 | 1) => {
    const ordered = [...rows].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    const i = ordered.findIndex((r) => r.id === row.id);
    const other = ordered[i + direction];
    if (!other) return;

    setBusyId(row.id);
    setNote(null);
    try {
      const save = (r: ExpertRow, sortOrder: number) =>
        fetch(`/api/admin/experts/${r.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...toDraft(r), sortOrder: String(sortOrder) }),
        });
      const [a, b] = await Promise.all([save(row, i + direction), save(other, i)]);
      if (!a.ok || !b.ok) {
        setNote("That order didn't save.");
        return;
      }
      router.refresh();
    } catch {
      setNote("Couldn't reach the server.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, language or speciality…"
          aria-label="Search therapists"
          className="min-w-[16rem] flex-1 rounded-full border border-forest-800/15 bg-ivory-light px-5 py-2.5 text-[0.92rem] text-forest-900 placeholder:text-ink/40 focus:border-forest-800 focus:outline-none"
        />
        <p className="text-[0.85rem] text-ink/55">
          {listed} listed · {rows.length - listed} hidden
        </p>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="press inline-flex items-center gap-2 rounded-full bg-forest-800 px-5 py-2.5 text-[0.9rem] font-semibold text-ivory transition-colors hover:bg-forest-700"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Add therapist
        </button>
      </div>

      {note && (
        <Alert tone="error" className="mt-5">
          {note}
        </Alert>
      )}

      <div className="mt-6 space-y-3">
        {shown.length === 0 && (
          <p className="rounded-2xl border border-dashed border-forest-800/20 px-5 py-10 text-center text-ink/55">
            {rows.length === 0 ? "No therapists yet. Add the first one." : "Nobody matches that search."}
          </p>
        )}

        {shown.map((row, i) => {
          const hidden = row.status !== "ACTIVE";
          return (
            <article
              key={row.id}
              className={cn(
                "grid gap-4 rounded-2xl border border-forest-800/10 bg-ivory-light p-4 shadow-lift sm:grid-cols-[4.5rem_1fr_auto] sm:items-center sm:p-5",
                hidden && "opacity-60"
              )}
            >
              <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-sage-light/50">
                {row.photo && (
                  <Image src={row.photo} alt="" fill sizes="64px" className="object-cover" unoptimized />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="font-display text-xl font-medium text-forest-900">{row.name}</h2>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      hidden ? "bg-forest-800/8 text-ink/55" : "bg-sage-light/70 text-forest-800"
                    )}
                  >
                    {hidden ? "Hidden" : "Listed"}
                  </span>
                  <span className="text-xs text-ink/45">
                    {row.bookings} session{row.bookings === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-1 text-[0.85rem] text-ink/60">{row.credentials || "No credentials set"}</p>
                <p className="mt-1.5 text-[0.85rem] text-ink/60">
                  {row.experienceYears} yrs · {formatINR(row.price)}/session · ★ {row.rating} ·{" "}
                  {row.languages.join(", ") || "no languages"}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {row.specialties.map((s) => (
                    <span key={s} className="rounded-full bg-sage-light/70 px-2.5 py-1 text-xs font-medium text-forest-800">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(row, -1)}
                    disabled={i === 0 || !!busyId || !!query}
                    aria-label={`Move ${row.name} up`}
                    className="press grid h-8 w-8 place-items-center rounded-full border border-forest-800/15 text-forest-800 disabled:opacity-30"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 8l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => move(row, 1)}
                    disabled={i === shown.length - 1 || !!busyId || !!query}
                    aria-label={`Move ${row.name} down`}
                    className="press grid h-8 w-8 place-items-center rounded-full border border-forest-800/15 text-forest-800 disabled:opacity-30"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => patch(row, { status: hidden ? "ACTIVE" : "HIDDEN" })}
                  disabled={!!busyId}
                  className="press rounded-full border border-forest-800/20 px-4 py-2 text-sm font-medium text-forest-800 transition-colors hover:border-forest-800 disabled:opacity-60"
                >
                  {busyId === row.id ? "…" : hidden ? "Show on site" : "Hide"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(row)}
                  className="press rounded-full bg-forest-800 px-4 py-2 text-sm font-semibold text-ivory transition-colors hover:bg-forest-700"
                >
                  Edit
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <AnimatePresence>
        {(adding || editing) && (
          <ExpertForm
            row={editing}
            onClose={() => {
              setAdding(false);
              setEditing(null);
            }}
            onSaved={() => {
              setAdding(false);
              setEditing(null);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
