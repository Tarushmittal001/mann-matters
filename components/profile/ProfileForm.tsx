"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { Field, Select, TextArea } from "@/components/ui/Field";
import { Alert, Spinner } from "@/components/ui/Feedback";
import { languageOpts } from "@/lib/matching";
import {
  NOTES_MAX,
  OTP_LENGTH,
  collect,
  hasErrors,
  validateName,
  validateNotes,
  validateOtp,
  validatePhone,
} from "@/lib/validation";

export type Profile = {
  name: string;
  email: string;
  phone: string;
  phoneVerified: boolean;
  language: string;
  notes: string;
  emailVerified: boolean;
  memberSince: string;
};

export default function ProfileForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [savedPhone, setSavedPhone] = useState(initial.phone);
  const [phoneVerified, setPhoneVerified] = useState(initial.phoneVerified);
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [phoneVerificationError, setPhoneVerificationError] = useState<string | null>(null);
  const [submittingPhone, setSubmittingPhone] = useState(false);
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
      setPhone(data.profile.phone);
      setSavedPhone(data.profile.phone);
      setPhoneVerified(data.profile.phoneVerified);
      setOtpRequested(false);
      setOtp("");
      setDevOtp(null);
      // the nav greets people by name, so it needs the new one
      router.refresh();
      setTimeout(() => setStatus("idle"), 2600);
    } catch {
      setError("We couldn't reach the server. Please check your connection and try again.");
      setStatus("idle");
    }
  };

  const busy = status === "saving";

  const requestPhoneVerification = async () => {
    setPhoneVerificationError(null);
    setSubmittingPhone(true);
    try {
      const response = await fetch("/api/profile/phone/request", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setPhoneVerificationError(data.error ?? "We couldn't send a code. Please try again.");
        return;
      }
      if (data.alreadyVerified) {
        setPhoneVerified(true);
        return;
      }
      setOtpRequested(true);
      setOtp("");
      setDevOtp(data.devCode ?? null);
    } catch {
      setPhoneVerificationError("We couldn't reach the server. Please try again.");
    } finally {
      setSubmittingPhone(false);
    }
  };

  const verifyPhone = async () => {
    const otpError = validateOtp(otp);
    if (otpError) {
      setPhoneVerificationError(otpError);
      return;
    }
    setPhoneVerificationError(null);
    setSubmittingPhone(true);
    try {
      const response = await fetch("/api/profile/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otp }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setPhoneVerificationError(data.error ?? "We couldn't verify that code.");
        return;
      }
      setPhoneVerified(true);
      setOtpRequested(false);
      setOtp("");
      setDevOtp(null);
    } catch {
      setPhoneVerificationError("We couldn't reach the server. Please try again.");
    } finally {
      setSubmittingPhone(false);
    }
  };

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
        onChange={(value) => {
          setPhone(value);
          if (value !== savedPhone) {
            setPhoneVerified(false);
            setOtpRequested(false);
            setOtp("");
            setDevOtp(null);
          }
        }}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="98765 43210"
        disabled={busy || submittingPhone}
        error={fields.phone}
        hint="Verify it once to enable phone sign-in. Never shared."
      />

      {phone && phone === savedPhone && (
        <div className="-mt-3 rounded-2xl border border-forest-800/10 bg-forest-800/[0.03] p-4">
          {phoneVerified ? (
            <p className="flex items-center gap-2 text-sm font-medium text-forest-700">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-sage-light text-xs" aria-hidden="true">
                ✓
              </span>
              Mobile verified. You can sign in with a one-time code.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink/60">Confirm this number before using phone sign-in.</p>
                <button
                  type="button"
                  onClick={requestPhoneVerification}
                  disabled={submittingPhone}
                  className="min-h-11 rounded-full border border-forest-800/20 px-5 text-sm font-semibold text-forest-800 transition-colors hover:bg-forest-800 hover:text-ivory disabled:opacity-50"
                >
                  {submittingPhone ? "Sending…" : otpRequested ? "Resend code" : "Verify mobile"}
                </button>
              </div>

              {otpRequested && (
                <div className="space-y-3">
                  <Field
                    label="One-time code"
                    required
                    inputMode="numeric"
                    value={otp}
                    onChange={(value) => setOtp(value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                    autoComplete="one-time-code"
                    disabled={submittingPhone}
                    placeholder={`${OTP_LENGTH}-digit code`}
                  />
                  {devOtp && (
                    <Alert tone="warning">
                      Development code: <strong className="font-mono">{devOtp}</strong>
                    </Alert>
                  )}
                  <button
                    type="button"
                    onClick={verifyPhone}
                    disabled={submittingPhone}
                    className="min-h-11 rounded-full bg-forest-800 px-5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-700 disabled:opacity-50"
                  >
                    {submittingPhone ? "Checking…" : "Confirm mobile"}
                  </button>
                </div>
              )}

              {phoneVerificationError && (
                <Alert tone="error">{phoneVerificationError}</Alert>
              )}
            </div>
          )}
        </div>
      )}

      {phone && phone !== savedPhone && (
        <p className="-mt-3 text-sm text-ink/50">Save changes before verifying this number.</p>
      )}

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
