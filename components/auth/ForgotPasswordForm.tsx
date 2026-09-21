"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Alert, CrisisLine, Spinner } from "@/components/ui/Feedback";
import { validateEmail } from "@/lib/validation";

/** "Forgot password": ask for the address, send the link, say the same thing either way. */
export default function ForgotPasswordForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const invalid = validateEmail(email);
    setFieldError(invalid ?? undefined);
    if (invalid) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 422 && data.fields?.email) setFieldError(data.fields.email);
        else setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDevLink(data.devLink ?? null);
      setSent(true);
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
          forgot password
        </p>

        {sent ? (
          <>
            <h1 className="h-display text-4xl">Check your inbox.</h1>
            <p className="mt-4 leading-relaxed text-ink/65">
              If <span className="font-semibold text-forest-900">{email.trim()}</span> has an Emoraa
              account, a link to set a new password is on its way. It works once and expires in an
              hour.
            </p>

            {devLink && (
              <div className="mt-6 rounded-2xl border border-gold/40 bg-gold/10 p-5">
                <p className="text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-gold-dark">
                  Development only
                </p>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-ink/70">
                  No mail provider is configured, so nothing was sent. Use this link:
                </p>
                <a href={devLink} className="mt-2 block break-all text-[0.82rem] font-medium text-forest-800 underline">
                  {devLink}
                </a>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Button href="/login" variant="forest">
                Back to sign in
              </Button>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="link-draw text-sm font-medium text-forest-800"
              >
                Use a different email
              </button>
            </div>
            <p className="mt-8 text-xs leading-relaxed text-ink/45">
              No email after a few minutes? Check your spam folder, or ask for another link.
            </p>
          </>
        ) : (
          <>
            <h1 className="h-display text-4xl">Let&apos;s get you back in.</h1>
            <p className="mt-4 leading-relaxed text-ink/65">
              Tell us the email you signed up with and we&apos;ll send a link to set a new password.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
              <Field
                label="Email"
                required
                type="email"
                inputMode="email"
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  setFieldError(undefined);
                }}
                autoComplete="email"
                disabled={submitting}
                error={fieldError}
                placeholder="you@example.com"
              />

              {error && <Alert tone="error">{error}</Alert>}

              <div className="pt-1">
                <Button type="submit" variant="forest" className="w-full" disabled={submitting}>
                  {submitting ? <Spinner label="Sending the link…" /> : "Email me a reset link"}
                </Button>
              </div>
            </form>

            <p className="mt-7 text-sm text-ink/60">
              Remembered it?{" "}
              <Link href="/login" className="font-semibold text-forest-800 underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </>
        )}

        <CrisisLine className="mt-10" />
      </div>
    </div>
  );
}
