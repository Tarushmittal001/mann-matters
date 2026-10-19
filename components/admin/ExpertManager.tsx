"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import {
  priceForExpertService,
  services as CATALOGUE,
  servicesForExpert,
} from "@/lib/services";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Portal from "@/components/ui/Portal";
import { Field, Select, TextArea } from "@/components/ui/Field";
import ExpertAccessDialog from "@/components/admin/ExpertAccessDialog";
import { Alert, Spinner } from "@/components/ui/Feedback";
import {
  EXPERT_LIMITS,
  emptyExpertDraft,
  validateExpert,
  type ExpertDraft,
} from "@/lib/expert-admin";
import {
  LANGUAGE_SUGGESTIONS,
  SPECIALITY_SUGGESTIONS,
  mergeSuggestions,
} from "@/lib/expert-vocab";
import { cn, formatINR } from "@/lib/utils";
import {
  PROFESSIONS,
  canPrescribe,
  professionLabel,
  registrationRequired,
  requiresPrescriber,
  REGISTER_OPTIONS,
} from "@/lib/professions";
import { useConfirm } from "@/components/ui/ConfirmDialog";

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
  profession: string;
  registrationNo: string;
  registrationBody: string;
  experienceYears: number;
  languages: string[];
  specialties: string[];
  price: number;
  rating: number;
  photo: string;
  bio: string;
  services: string[];
  /** Their rate per service slug, where it differs from the standard price. */
  servicePrices: Record<string, number>;
  status: string;
  sortOrder: number;
  bookings: number;
  /**
   * Who can sign in as this listing.
   *   none        — nobody can. The listing is bookable and unreadable by its owner.
   *   unconfirmed — an account exists, but nothing proves anyone reads that inbox.
   *   invited     — a live link is out, unspent.
   *   active      — they set a password and have been in.
   */
  access: { state: "none" | "unconfirmed" | "invited" | "active"; email: string };
  /** Whether they may keep session notes; null while nobody can sign in as the listing. */
  notes: { policy: string; note: string } | null;
};

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * What this listing actually charges, for the one line on its card.
 *
 * It replaced `formatINR(row.price)`, which printed a flat per-therapist fee
 * that nothing had charged since the service became the unit of sale — the
 * card said "₹1,199/session" for someone whose sessions cost ₹999, ₹799 or
 * ₹899. A number on an admin screen is read as fact, so it now comes from the
 * same place the booking route reads.
 */
function priceSummary(row: ExpertRow): string {
  const amounts = servicesForExpert(row)
    .map((s) => priceForExpertService(row, s.slug))
    .filter((p): p is number => typeof p === "number");
  if (!amounts.length) return "not bookable";
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  const span = min === max ? formatINR(min) : `${formatINR(min)}–${formatINR(max)}`;
  return `${span} · ${amounts.length} service${amounts.length === 1 ? "" : "s"}`;
}

const toDraft = (r: ExpertRow): ExpertDraft => ({
  name: r.name,
  credentials: r.credentials,
  profession: r.profession,
  registrationNo: r.registrationNo,
  registrationBody: r.registrationBody ?? "",
  experienceYears: String(r.experienceYears),
  languages: r.languages,
  specialties: r.specialties,
  services: r.services,
  servicePrices: Object.fromEntries(
    Object.entries(r.servicePrices).map(([slug, amount]) => [slug, String(amount)])
  ),
  // editing never carries a login address: that is Manage's job
  loginEmail: "",
  price: String(r.price),
  rating: String(r.rating),
  photo: r.photo,
  bio: r.bio,
  status: r.status,
  sortOrder: String(r.sortOrder),
});

/**
 * A list of short strings, edited as chips, with a dropdown of known values.
 *
 * It is a combobox rather than a `<select>` on purpose. Matching reads these
 * words literally, so picking from a list is what keeps "Anxiety" from
 * becoming four spellings across ten listings — but a therapist who speaks
 * Konkani has to be listable the day they join, not after a code change. So
 * the list leads, and typing something new is still allowed and still says so.
 */
function ChipInput({
  label,
  values,
  onChange,
  error,
  hint,
  placeholder,
  disabled,
  suggestions = [],
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Offered in a dropdown; anything not on it can still be typed. */
  suggestions?: string[];
}) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  /** -1 = nothing highlighted, so Enter commits what was typed rather than a guess. */
  const [active, setActive] = useState(-1);
  const listId = useId();

  /**
   * Not already chosen, and matching what has been typed so far.
   *
   * The whole list is rendered rather than a first few — there are fifty-odd
   * specialities and an admin who cannot see the one they want assumes it
   * isn't there and types their own spelling, which is the exact drift the
   * dropdown exists to prevent. The list scrolls instead.
   */
  const matches = useMemo(() => {
    const chosen = new Set(values.map((v) => v.toLowerCase()));
    const q = text.trim().toLowerCase();
    return suggestions
      .filter((s) => !chosen.has(s.toLowerCase()))
      .filter((s) => !q || s.toLowerCase().includes(q));
  }, [suggestions, values, text]);

  const isNew = text.trim().length > 0 && !suggestions.some((s) => s.toLowerCase() === text.trim().toLowerCase());

  /* With fifty-odd options the highlight walks off the bottom of the scroll
     box, and arrowing into something you cannot see is the same as it not
     being there. */
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (active < 0) return;
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const add = (value: string) => {
    const v = value.trim();
    if (!v) return;
    if (!values.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...values, v]);
    setText("");
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (!matches.length) return;
      setActive((i) => {
        const next = e.key === "ArrowDown" ? i + 1 : i - 1;
        return ((next % matches.length) + matches.length) % matches.length;
      });
      return;
    }
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      // a highlighted suggestion wins, so ↓ then Enter does what it looks like;
      // otherwise the typed words are taken as they are
      add(active >= 0 && matches[active] ? matches[active] : text);
      return;
    }
    if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "Backspace" && !text && values.length) onChange(values.slice(0, -1));
  };

  return (
    <div className="relative">
      <label className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-ink/70">
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
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 && matches[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          // commit what was typed, but only after a click on the list has had
          // its chance — a blur fires before the option's click does
          onBlur={() => {
            window.setTimeout(() => {
              setOpen(false);
              setActive(-1);
              if (text.trim()) add(text);
            }, 120);
          }}
          disabled={disabled}
          placeholder={values.length ? "Add another…" : placeholder}
          className="min-w-[8rem] flex-1 bg-transparent px-2 py-1 text-[0.95rem] text-forest-900 placeholder:text-ink/70 focus:outline-none"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label={open ? `Hide ${label.toLowerCase()} suggestions` : `Show ${label.toLowerCase()} suggestions`}
          onClick={() => setOpen((o) => !o)}
          className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink/70 transition-colors hover:bg-forest-800/5 hover:text-forest-900"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M2.5 4.5L6 8l3.5-3.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("origin-center transition-transform", open && "rotate-180")}
            />
          </svg>
        </button>
      </div>

      {open && (matches.length > 0 || isNew) && (
        <ul
          id={listId}
          role="listbox"
          ref={listRef}
          className="absolute left-0 right-0 z-20 mt-1 max-h-[19rem] overflow-y-auto rounded-xl border border-forest-800/15 bg-ivory-light py-1 shadow-lift"
        >
          {matches.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                id={`${listId}-${i}`}
                data-index={i}
                role="option"
                aria-selected={i === active}
                // mousedown, not click: the input's blur would otherwise close
                // the list out from under the pointer
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(s);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "block w-full px-3.5 py-2 text-left text-[0.9rem] text-forest-900 transition-colors",
                  i === active ? "bg-sage-light/70" : "hover:bg-forest-800/[0.04]"
                )}
              >
                {s}
              </button>
            </li>
          ))}
          {isNew && (
            <li className="border-t border-forest-800/10 px-3.5 py-2 text-[0.82rem] text-ink/70">
              Press Enter to add <span className="font-medium text-forest-800">{text.trim()}</span> as a new
              one.
            </li>
          )}
        </ul>
      )}

      <p className={cn("mt-1.5 text-[0.8rem]", error ? "text-red-700" : "text-ink/70")}>
        {error ?? hint}
      </p>
    </div>
  );
}

/**
 * The portrait: chosen from the computer, or pasted in as an address.
 *
 * The file goes to /api/admin/experts/photo, which writes it into
 * public/experts and hands back an ordinary path. So whichever way it is set,
 * what ends up on the listing is the same kind of string it always was.
 *
 * The image is shrunk to a square here, in the browser, before it is sent. A
 * portrait straight off a phone is several megabytes of detail that a 64px
 * card will never show, and resizing it here means the slowest part of this
 * (the upload) is the part we made smallest.
 */
function PhotoField({
  value,
  name,
  onChange,
  error,
  disabled,
}: {
  value: string;
  /** The therapist's name, only so the saved file is readable in the folder. */
  name: string;
  onChange: (v: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setProblem(null);
    setBusy(true);
    try {
      const body = new FormData();
      const { file: sending, decoded } = await squareJpeg(file);
      body.append("file", sending);
      body.append("name", name);
      const res = await fetch("/api/admin/experts/photo", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // a file the browser could not decode is almost always the reason the
        // server then refuses it, and saying so names something fixable
        setProblem(
          !decoded
            ? "This browser can't read that image. Save it as a JPEG or PNG and try again."
            : data.fields?.photo ?? data.error ?? "That upload didn't work. Please try again."
        );
        return;
      }
      setBroken(false);
      onChange(data.path);
    } catch {
      setProblem("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const shown = value.trim();

  return (
    <div>
      <p className="mb-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-ink/70">
        Photo <span className="text-red-700">*</span>
      </p>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-forest-800/15 bg-ivory-light p-3">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-sage-light/40">
          {shown && !broken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shown}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setBroken(true)}
              onLoad={() => setBroken(false)}
            />
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-forest-800/30">
              <circle cx="12" cy="9" r="3.4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4.8 20a7.4 7.4 0 0114.4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-forest-800/20 px-4 py-2 text-[0.85rem] font-medium text-forest-800 transition-colors hover:border-forest-800 hover:bg-forest-800/[0.04]",
                (disabled || busy) && "opacity-60"
              )}
            >
              {busy && <Spinner className="h-3.5 w-3.5" />}
              {busy ? "Uploading…" : shown ? "Replace photo" : "Choose from your computer"}
            </button>
            <input
              ref={fileRef}
              type="file"
              /* every image the browser will offer, not three types. A picker
                 that greys out the photo somebody is trying to use looks
                 broken; a clear message after the fact does not. */
              accept="image/*"
              disabled={disabled || busy}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                // cleared first, so choosing the same file twice still fires
                e.target.value = "";
                void pick(file);
              }}
            />
            {shown && !busy && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  onChange("");
                  setBroken(false);
                  setProblem(null);
                }}
                className="link-draw text-[0.85rem] font-medium text-ink/70"
              >
                Remove
              </button>
            )}
          </div>
          <p className="mt-2 text-[0.78rem] text-ink/70">
            JPEG, PNG or WebP. It is cropped to a square and shrunk before it is sent.
          </p>
        </div>
      </div>

      <details className="mt-2.5 group">
        <summary className="cursor-pointer list-none text-[0.82rem] text-ink/70 transition-colors hover:text-forest-800">
          <span className="link-draw">Or paste an address instead</span>
        </summary>
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setBroken(false);
          }}
          disabled={disabled || busy}
          placeholder="https://… or /experts/ananya.jpg"
          className="mt-2 w-full rounded-xl border border-forest-800/15 bg-ivory-light px-3.5 py-2.5 text-[0.9rem] text-forest-900 placeholder:text-ink/70 focus:border-forest-800/40 focus:outline-none"
        />
      </details>

      <p className={cn("mt-1.5 text-[0.8rem]", error || problem ? "text-red-700" : "text-ink/70")}>
        {problem ?? error ?? (broken && shown ? "That address didn't load." : "A portrait, roughly square.")}
      </p>
    </div>
  );
}

/**
 * Centre-crop to a square and scale down to 512px, as a JPEG.
 *
 * 512 is twice the largest the photo is ever displayed at, so it still looks
 * right on a retina screen, and it turns a 4 MB phone portrait into something
 * closer to 60 KB. If the browser can't decode the file, the original is sent
 * and the server decides — better a slow upload than a lost one.
 */
async function squareJpeg(file: File, size = 512): Promise<{ file: File; decoded: boolean }> {
  try {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { file, decoded: false };
    ctx.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size
    );
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.86)
    );
    if (!blob) return { file, decoded: false };
    return { file: new File([blob], "portrait.jpg", { type: "image/jpeg" }), decoded: true };
  } catch {
    // an image format this browser cannot decode — HEIC off an iPhone is the
    // usual one. Send the original and let the server have the last word.
    return { file, decoded: false };
  }
}

function ExpertForm({
  row,
  onClose,
  onSaved,
  vocab,
}: {
  row: ExpertRow | null;
  onClose: () => void;
  onSaved: () => void;
  /** Words already in use on the catalogue, offered alongside the curated lists. */
  vocab: { languages: string[]; specialties: string[] };
}) {
  const [draft, setDraft] = useState<ExpertDraft>(row ? toDraft(row) : emptyExpertDraft);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [confirm, confirmDialog] = useConfirm();
  /** The listing was created but its invite was refused; says why. */
  const [savedWithoutLogin, setSavedWithoutLogin] = useState<string | null>(null);

  const set = <K extends keyof ExpertDraft>(key: K, value: ExpertDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setFields((f) => (f[key as string] ? { ...f, [key as string]: "" } : f));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const local = validateExpert(draft, { creating: !row });
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
      /*
       * The listing saved. If a login was asked for and could not be set up,
       * say so here rather than closing on a half-done job — the admin would
       * otherwise find out only by noticing "No login" on the new card, which
       * is exactly the discovery this change exists to prevent.
       */
      if (data.invite?.problem) {
        setSavedWithoutLogin(data.invite.problem);
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
    if (
      !(await confirm({
        title: `Delete ${row.name}?`,
        body: "They come off the catalogue for good. This can't be undone — hiding them keeps their sessions and notes.",
        confirmLabel: "Delete listing",
        danger: true,
      }))
    )
      return;
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
      {confirmDialog}
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
                <p className="mt-1 text-[0.82rem] text-ink/70">
                  Public id <span className="font-mono">{row.slug}</span> · {row.bookings} session
                  {row.bookings === 1 ? "" : "s"} on record
                </p>
              )}
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
                  required
                  value={draft.credentials}
                  onChange={(v) => set("credentials", v)}
                  error={fields.credentials}
                  maxLength={EXPERT_LIMITS.credentialsMax}
                  placeholder="M.A. Clinical Psychology"
                  disabled={!!busy}
                  hint="The qualification you have checked, shown on their card as written. Only you set this — it no longer decides who can prescribe; Profession does."
                />
              </div>

              {/* Declared, never guessed: this is the one fact that decides who
                  may prescribe and who can be booked for medication. */}
              <Select
                label="Profession"
                required
                value={draft.profession}
                onChange={(v) => {
                  set("profession", v);
                  // someone who cannot prescribe cannot keep the medication
                  // service, or its rate
                  if (!canPrescribe(v) && draft.services.some(requiresPrescriber)) {
                    set("services", draft.services.filter((s) => !requiresPrescriber(s)));
                    const next = { ...draft.servicePrices };
                    for (const slug of Object.keys(next)) if (requiresPrescriber(slug)) delete next[slug];
                    set("servicePrices", next);
                  }
                }}
                options={PROFESSIONS.map((p) => ({ value: p.value, label: p.label }))}
                placeholder="Choose what they are…"
                error={fields.profession}
                hint={PROFESSIONS.find((p) => p.value === draft.profession)?.note}
                disabled={!!busy}
              />
              {/*
                Which register, chosen per practitioner. The site calls its
                people "certified" and never claims the group is on a council
                register — this is how someone who IS on one shows it.
              */}
              <Select
                label="On a council register?"
                value={draft.registrationBody}
                onChange={(v) => set("registrationBody", v)}
                options={REGISTER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                disabled={!!busy}
                hint="Shown on their public profile. Leave as None unless they are actually registered."
              />
              <Field
                label="Registration number"
                required={draft.status === "ACTIVE" && registrationRequired(draft.profession)}
                value={draft.registrationNo}
                onChange={(v) => set("registrationNo", v)}
                error={fields.registrationNo}
                maxLength={EXPERT_LIMITS.registrationMax}
                placeholder={draft.profession === "PSYCHIATRIST" ? "e.g. DMC/R/12345" : "e.g. A12345"}
                hint={`${
                  PROFESSIONS.find((p) => p.value === draft.profession)?.register ?? "Registration or membership number"
                }. Shown on their profile so clients can check it.${
                  registrationRequired(draft.profession) ? " Needed before they can be listed." : ""
                }`}
                disabled={!!busy}
              />

              <Field
                label="Years of experience"
                inputMode="numeric"
                value={draft.experienceYears}
                onChange={(v) => set("experienceYears", v.replace(/\D/g, "").slice(0, 2))}
                error={fields.experienceYears}
                placeholder="9"
                disabled={!!busy}
                hint="Optional — they fill this in from their portal."
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
                hint="New listings start hidden. List them once they have added their languages and focus areas."
              />

              <div className="sm:col-span-2">
                <ChipInput
                  label="Languages"
                  values={draft.languages}
                  onChange={(v) => set("languages", v)}
                  error={fields.languages}
                  hint="They choose these from their portal; you only need to if helping them. Needed before listing — these drive language matching."
                  placeholder="English, Hindi, Tamil…"
                  suggestions={vocab.languages}
                  disabled={!!busy}
                />
              </div>
              <div className="sm:col-span-2">
                <ChipInput
                  label="Specialities"
                  values={draft.specialties}
                  onChange={(v) => set("specialties", v)}
                  error={fields.specialties}
                  hint="They choose these from their portal. Needed before listing — matching reads these words."
                  placeholder="Anxiety, Workplace stress…"
                  suggestions={vocab.specialties}
                  disabled={!!busy}
                />
              </div>

              {/* The clinical gate. A client can only ever be put in front of
                  somebody ticked here, and a service nobody is ticked for is
                  not sold at all — which is how a psychiatry consultation
                  stops being bookable with a psychologist. */}
              <div className="sm:col-span-2">
                <p className="mb-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-ink/70">
                  Cleared to deliver
                </p>
                <p className="mb-3 text-[0.8rem] leading-relaxed text-ink/70">
                  Only tick what they are actually qualified and insured for. This decides what
                  clients can book them for, and what each session costs. A ticked service is
                  charged at the standard price unless you set a different one here.
                </p>
                <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                  {CATALOGUE.map((sv) => {
                    const on = draft.services.includes(sv.slug);
                    const locked = requiresPrescriber(sv.slug) && !canPrescribe(draft.profession);
                    const typed = draft.servicePrices[sv.slug] ?? "";
                    const standard = typeof sv.price === "number" ? sv.price : null;
                    const overridden = typed !== "" && Number(typed) !== standard;
                    return (
                      <div
                        key={sv.slug}
                        className={cn(
                          "rounded-lg px-2 py-1.5 transition-colors",
                          on ? "bg-forest-800/[0.03]" : "hover:bg-forest-800/[0.02]"
                        )}
                      >
                        <label className={cn("flex items-start gap-2.5", locked ? "cursor-not-allowed opacity-60" : "cursor-pointer")}>
                          <input
                            type="checkbox"
                            checked={on}
                            disabled={!!busy || locked}
                            onChange={(e) => {
                              set(
                                "services",
                                e.target.checked
                                  ? [...draft.services, sv.slug]
                                  : draft.services.filter((v) => v !== sv.slug)
                              );
                              // unticking clears the rate too, so a service
                              // that comes back later starts from standard
                              // rather than from a number nobody remembers
                              if (!e.target.checked && sv.slug in draft.servicePrices) {
                                const next = { ...draft.servicePrices };
                                delete next[sv.slug];
                                set("servicePrices", next);
                              }
                            }}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-[#C8A45D]"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[0.88rem] leading-snug text-forest-900">
                              {sv.title}
                            </span>
                            <span className="block text-[0.76rem] text-ink/70">
                              {sv.duration}
                              {locked && " · psychiatrists only, as it involves prescribing"}
                            </span>
                          </span>
                        </label>

                        {on && (
                          <div className="mt-1.5 flex items-center gap-2 pl-[1.625rem]">
                            <span className="text-[0.8rem] text-ink/70">₹</span>
                            <input
                              inputMode="numeric"
                              value={typed}
                              disabled={!!busy}
                              placeholder={standard === null ? "on request" : String(standard)}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                                const next = { ...draft.servicePrices };
                                // blank means "whatever the service costs" —
                                // it is an absent override, not a zero
                                if (digits === "") delete next[sv.slug];
                                else next[sv.slug] = digits;
                                set("servicePrices", next);
                              }}
                              className={cn(
                                "w-24 rounded-lg border bg-ivory-light px-2.5 py-1 text-[0.85rem] text-forest-900 placeholder:text-ink/70 focus:outline-none",
                                fields[`servicePrices.${sv.slug}`]
                                  ? "border-red-300"
                                  : "border-forest-800/15 focus:border-forest-800/40"
                              )}
                            />
                            <span className="text-[0.75rem] text-ink/70">
                              {fields[`servicePrices.${sv.slug}`] ??
                                (overridden
                                  ? "their rate"
                                  : standard === null
                                    ? "priced on request"
                                    : "standard")}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {fields.services && (
                  <p role="alert" className="mt-2.5 text-[0.82rem] text-red-700">
                    {fields.services}
                  </p>
                )}
                {draft.services.length === 0 && (
                  <p className="mt-2.5 text-[0.8rem] text-gold-dark">
                    Nothing ticked — this therapist will not be bookable for anything.
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <PhotoField
                  value={draft.photo}
                  name={draft.name}
                  onChange={(v) => set("photo", v)}
                  error={fields.photo}
                  disabled={!!busy}
                />
              </div>

              {/* Asked here, not afterwards. A listing with no login is a
                  therapist who is bookable by clients and cannot see a single
                  one of those bookings — so the invite belongs in the same act
                  as creating them, not in a second visit to a card that now
                  reads "No login". An existing listing changes its login
                  through Manage instead, where removing and re-inviting is a
                  deliberate two-step act rather than a side effect of editing
                  a credential line. */}
              {!row && (
                <div className="sm:col-span-2">
                  <Field
                    label="Their login"
                    required
                    type="email"
                    value={draft.loginEmail}
                    onChange={(v) => set("loginEmail", v)}
                    error={fields.loginEmail}
                    placeholder="ananya@emoraa.com"
                    disabled={!!busy}
                    hint="We'll email them a link to choose their own password — you never see it. They then complete their introduction, languages and focus areas themselves."
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <TextArea
                  label="Short bio"
                  value={draft.bio}
                  onChange={(v) => set("bio", v)}
                  error={fields.bio}
                  rows={3}
                  maxLength={EXPERT_LIMITS.bioMax}
                  disabled={!!busy}
                  hint="Their introduction. They write this from their portal; edit only to correct it."
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

            {savedWithoutLogin && (
              <Alert tone="warning" className="mt-6">
                <strong className="font-semibold">{draft.name} was added</strong> — but the login
                was not set up: {savedWithoutLogin} You can sort it from their card with Manage.
              </Alert>
            )}

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
  /* The dropdowns offer the curated lists first, then anything this catalogue
     already uses — so a word typed once for one therapist is the obvious pick
     for the next, instead of being retyped slightly differently. */
  const vocab = useMemo(
    () => ({
      languages: mergeSuggestions(LANGUAGE_SUGGESTIONS, rows.flatMap((r) => r.languages)),
      specialties: mergeSuggestions(SPECIALITY_SUGGESTIONS, rows.flatMap((r) => r.specialties)),
    }),
    [rows]
  );

  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ExpertRow | null>(null);
  const [accessFor, setAccessFor] = useState<ExpertRow | null>(null);
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
        // a quick action has no form to highlight, so say which field stopped it
        const field = data.fields ? Object.values(data.fields as Record<string, string>).find(Boolean) : null;
        setNote(field ? `${row.name}: ${field}` : data.error ?? "That didn't save.");
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
          className="min-w-[16rem] flex-1 rounded-full border border-forest-800/15 bg-ivory-light px-5 py-2.5 text-[0.92rem] text-forest-900 placeholder:text-ink/70 focus:border-forest-800 focus:outline-none"
        />
        <p className="text-[0.85rem] text-ink/70">
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
          <p className="rounded-2xl border border-dashed border-forest-800/20 px-5 py-10 text-center text-ink/70">
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
                      hidden ? "bg-forest-800/8 text-ink/70" : "bg-sage-light/70 text-forest-800"
                    )}
                  >
                    {hidden ? "Hidden" : "Listed"}
                  </span>
                  <span className="text-xs text-ink/70">
                    {row.bookings} session{row.bookings === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-1 text-[0.85rem] text-ink/70">
                  <span className="font-medium text-forest-800">{professionLabel(row.profession)}</span>
                  {" · "}
                  {row.credentials || "No credentials set"}
                  {row.registrationNo ? (
                    <> · Reg. {row.registrationNo}</>
                  ) : (
                    <span className="ml-2 rounded-full bg-gold/25 px-2 py-0.5 text-[0.75rem] font-semibold text-gold-dark">
                      No registration number
                    </span>
                  )}
                </p>
                <p className="mt-1.5 text-[0.85rem] text-ink/70">
                  {row.experienceYears} yrs · {priceSummary(row)} · ★ {row.rating} ·{" "}
                  {row.languages.join(", ") || "no languages"}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {row.specialties.map((s) => (
                    <span key={s} className="rounded-full bg-sage-light/70 px-2.5 py-1 text-xs font-medium text-forest-800">
                      {s}
                    </span>
                  ))}
                </div>

                {/* A listing with no login is bookable by clients and unreadable
                    by the practitioner it names. That is worth saying on the
                    card, not hiding a click deep. */}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-forest-800/8 pt-2.5">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      row.access.state === "active" && "bg-sage-light/70 text-forest-800",
                      row.access.state === "invited" && "bg-gold/20 text-gold-dark",
                      row.access.state === "unconfirmed" && "bg-gold/20 text-gold-dark",
                      row.access.state === "none" && "bg-red-50 text-red-700"
                    )}
                  >
                    {row.access.state === "active" && "Can sign in"}
                    {row.access.state === "invited" && "Invite sent"}
                    {row.access.state === "unconfirmed" && "Address unconfirmed"}
                    {row.access.state === "none" && "No login"}
                  </span>
                  <span className="min-w-0 truncate text-xs text-ink/70">
                    {row.access.email || "can't see their own sessions"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAccessFor(row)}
                    className="link-draw text-xs font-medium text-forest-800"
                  >
                    {row.access.state === "none" ? "Give them a login" : "Manage"}
                  </button>
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
            vocab={vocab}
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

      <AnimatePresence>
        {accessFor && (
          <ExpertAccessDialog
            row={accessFor}
            onClose={() => setAccessFor(null)}
            onDone={() => router.refresh()}
          />
        )}
      </AnimatePresence>
    </>
  );
}
