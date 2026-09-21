"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Alert, CrisisLine, Spinner } from "@/components/ui/Feedback";
import { PASSWORD_MIN, validatePassword } from "@/lib/validation";

/** Set a new password from an emailed link. The link's validity is checked on the server first. */
export default function ResetPasswordForm({ token, name }: { token: string; name: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const local: Record<string, string> = {};
    const weak = validatePassword(password);
    if (weak) local.password = weak;
    if (password !== confirm) local.confirm = "These two don't match.";
    setFields(local);
    if (Object.keys(local).length) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 410) setExpired(true);
        else if (res.status === 422 && data.fields?.password) setFields({ password: data.fields.password });
        else setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
      const home = data.role === "ADMIN" ? "/admin" : data.role === "EXPERT" ? "/expert" : "/dashboard";
      // a full load, so every server component sees the new session cookie
      window.location.assign(home);
    } catch {
      setError("Couldn't reach the server. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-top wrap flex min-h-[70vh] items-center justify-center pb-24">
      <div className="w-full max-w-md">
        <p className="eyebrow mb-4 flex items-center gap-3">
          <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">
            मन
          </span>
          new password
        </p>

        {expired ? (
          <>
            <h1 className="h-display text-4xl">That link has expired.</h1>
            <p className="mt-4 leading-relaxed text-ink/65">
              Reset links work once and last an hour. Ask for a fresh one and you&apos;ll be back in
              shortly.
            </p>
            <div className="mt-8">
              <Button href="/forgot-password" variant="forest">
                Send me a new link
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="h-display text-4xl">Choose a new password{name ? `, ${name.split(" ")[0]}` : ""}.</h1>
            <p className="mt-4 leading-relaxed text-ink/65">
              Once it&apos;s saved you&apos;ll be signed in here, and signed out everywhere else.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
              <Field
                label="New password"
                required
                type="password"
                value={password}
                onChange={(v) => {
                  setPassword(v);
                  setFields((f) => ({ ...f, password: "" }));
                }}
                autoComplete="new-password"
                disabled={submitting || done}
                error={fields.password || undefined}
                placeholder={`At least ${PASSWORD_MIN} characters`}
                hint="A phrase you'll remember beats a word you won't."
              />
              <Field
                label="Confirm new password"
                required
                type="password"
                value={confirm}
                onChange={(v) => {
                  setConfirm(v);
                  setFields((f) => ({ ...f, confirm: "" }));
                }}
                autoComplete="new-password"
                disabled={submitting || done}
                error={fields.confirm || undefined}
                placeholder="Type it once more"
              />

              {error && <Alert tone="error">{error}</Alert>}
              {done && <Alert tone="success">Password changed. Taking you to your account…</Alert>}

              <div className="pt-1">
                <Button type="submit" variant="forest" className="w-full" disabled={submitting || done}>
                  {submitting ? <Spinner label="Saving…" /> : "Save and sign in"}
                </Button>
              </div>
            </form>
          </>
        )}

        <CrisisLine className="mt-10" />
      </div>
    </div>
  );
}
