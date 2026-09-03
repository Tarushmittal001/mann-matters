"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Alert, Spinner } from "@/components/ui/Feedback";
import { PASSWORD_MIN, validatePassword } from "@/lib/validation";

export default function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const [fields, setFields] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const local: Record<string, string> = {};
    if (!current) local.currentPassword = "Enter your current password.";
    const weak = validatePassword(next);
    if (weak) local.newPassword = weak;
    if (next !== confirm) local.confirmPassword = "These two don't match.";

    setFields(local);
    if (Object.keys(local).length) return;

    setStatus("saving");
    setError(null);

    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 422 && data.fields) {
        setFields(data.fields);
        setStatus("idle");
        return;
      }
      if (res.status === 429) {
        setError(data.error ?? "Too many attempts. Please wait a moment.");
        setStatus("idle");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "We couldn't change your password. Please try again.");
        setStatus("idle");
        return;
      }

      // don't leave the old or new password sitting in component state
      setCurrent("");
      setNext("");
      setConfirm("");
      setStatus("done");
    } catch {
      setError("We couldn't reach the server. Please check your connection and try again.");
      setStatus("idle");
    }
  };

  const busy = status === "saving";

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error && <Alert tone="error">{error}</Alert>}
      {status === "done" && (
        <Alert tone="success" title="Password changed.">
          You&apos;re still signed in here. If you use Emoraa on another device, you&apos;ll
          need the new password there.
        </Alert>
      )}

      <Field
        label="Current password"
        required
        type="password"
        value={current}
        onChange={setCurrent}
        autoComplete="current-password"
        disabled={busy}
        error={fields.currentPassword}
      />
      <Field
        label="New password"
        required
        type="password"
        value={next}
        onChange={setNext}
        autoComplete="new-password"
        disabled={busy}
        error={fields.newPassword}
        hint={`At least ${PASSWORD_MIN} characters. A phrase you'll remember beats a word you won't.`}
      />
      <Field
        label="Confirm new password"
        required
        type="password"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
        disabled={busy}
        error={fields.confirmPassword}
      />

      <div className="pt-1">
        <Button type="submit" variant="outline" disabled={busy}>
          {busy ? <Spinner label="Changing…" /> : "Change password"}
        </Button>
      </div>
    </form>
  );
}
