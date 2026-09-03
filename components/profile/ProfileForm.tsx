"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { Field, Select, TextArea } from "@/components/ui/Field";
import { Alert, Spinner } from "@/components/ui/Feedback";
import { languageOpts } from "@/lib/matching";
import { NOTES_MAX, collect, hasErrors, validateName, validateNotes, validatePhone } from "@/lib/validation";

export type Profile = {
  name: string;
  email: string;
  phone: string;
  language: string;
  notes: string;
  emailVerified: boolean;
  memberSince: string;
};

export default function ProfileForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [language, setLanguage] = useState(initial.language);
  const [notes, setNotes] = useState(initial.notes);

  const [fields, setFields] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  const dirty =
    name !== initial.name ||
    phone !== initial.phone ||
    language !== initial.language ||
    notes !== initial.notes;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const local = collect([
      ["name", validateName(name)],
      ["phone", validatePhone(phone)],
      ["notes", validateNotes(notes)],
    ]);
    setFields(local);
    if (hasErrors(local)) return;

    setStatus("saving");
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, language, notes }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 422 && data.fields) {
        setFields(data.fields);
        setStatus("idle");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "We couldn't save that. Please try again.");
        setStatus("idle");
        return;
      }

      setStatus("saved");
      // the nav greets people by name, so it needs the new one
      router.refresh();
      setTimeout(() => setStatus("idle"), 2600);
    } catch {
      setError("We couldn't reach the server. Please check your connection and try again.");
      setStatus("idle");
    }
  };

  const busy = status === "saving";

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {error && <Alert tone="error">{error}</Alert>}
      {status === "saved" && <Alert tone="success">Saved. Your details are up to date.</Alert>}

      <Field
        label="Your name"
        required
        value={name}
        onChange={setName}
        autoComplete="name"
        disabled={busy}
        error={fields.name}
        hint="What your therapist will call you."
      />

      {/* email is shown, never edited here — changing it needs a fresh
          verification round-trip, and doing it silently would let a stolen
          session lock the real owner out */}
      <div>
        <p className="mb-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-ink/55">
          Email
        </p>
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-forest-800/10 bg-forest-800/[0.03] px-4 py-3">
          <span className="text-[0.95rem] text-ink/70">{initial.email}</span>
          {initial.emailVerified && (
            <span className="rounded-full bg-sage-light/70 px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-forest-800">
              Verified
            </span>
          )}
        </div>
        <p className="mt-1.5 text-[0.8rem] text-ink/50">
          To change your email,{" "}
          <a href="/contact" className="font-medium text-forest-800 underline underline-offset-2">
            message us
          </a>{" "}
          — we&apos;ll verify the new address before switching it.
        </p>
      </div>

      <Field
        label="Mobile"
        value={phone}
        onChange={setPhone}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="98765 43210"
        disabled={busy}
        error={fields.phone}
        hint="Only used for session reminders and the joining link. Never shared."
      />

      <Select
        label="Preferred language"
        value={language}
        onChange={setLanguage}
        options={languageOpts}
        placeholder="No preference"
        disabled={busy}
        error={fields.language}
        hint="We'll put therapists who speak it first when you book."
      />

      <TextArea
        label="Anything your therapist should know"
        value={notes}
        onChange={setNotes}
        rows={4}
        maxLength={NOTES_MAX}
        disabled={busy}
        error={fields.notes}
        placeholder="Context you'd rather not repeat at the start of every session."
        hint={`Visible only to you and the therapist you book. ${NOTES_MAX - notes.length} characters left.`}
      />

      <div className="flex items-center gap-5 pt-2">
        <Button type="submit" variant="forest" disabled={busy || !dirty}>
          {busy ? <Spinner label="Saving…" /> : "Save changes"}
        </Button>
        {!dirty && status === "idle" && (
          <span className="text-[0.85rem] text-ink/45">Nothing to save yet.</span>
        )}
      </div>
    </form>
  );
}
