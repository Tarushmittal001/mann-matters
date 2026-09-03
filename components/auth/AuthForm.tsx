"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Alert, CrisisLine, Spinner } from "@/components/ui/Feedback";
import {
  PASSWORD_MIN,
  collect,
  hasErrors,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/validation";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next");
  // only ever follow an internal path — an absolute URL here would be an
  // open redirect, and a login page is exactly where that gets abused
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // after a successful signup — the "check your inbox" screen
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  // when login is blocked because the address isn't confirmed yet
  const [needsVerify, setNeedsVerify] = useState<string | null>(null);
  const [resendNote, setResendNote] = useState("");
  // development affordance: when no mail provider is configured the server hands
  // back the verification link so signup isn't a dead end on a fresh machine
  const [devLink, setDevLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(true);

  const isLogin = mode === "login";

  const resend = async (target: string) => {
    setResendNote("Sending…");
    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.devLink) {
        setDevLink(data.devLink);
        setResendNote("");
      } else {
        setResendNote("Sent. Check your inbox — and your spam folder.");
      }
    } catch {
      setResendNote("Couldn't resend just now. Please try again.");
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const local = collect([
      ...(isLogin ? [] : ([["name", validateName(name)]] as [string, string | null][])),
      ["email", validateEmail(email)],
      // on login, any password is worth *sending* — telling someone their
      // stored password is too short helps nobody
      ...(isLogin ? [] : ([["password", validatePassword(password)]] as [string, string | null][])),
    ]);
    setFields(local);
    if (hasErrors(local)) return;

    setSubmitting(true);
    setError("");
    setNeedsVerify(null);

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isLogin ? { email, password } : { name, email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 422 && data.fields) setFields(data.fields);
        if (isLogin && data.needsVerification) setNeedsVerify(data.email ?? email);
        setError(
          res.status === 422 && data.fields
            ? ""
            : data.error ?? "Something went wrong. Please try again."
        );
        setSubmitting(false);
        return;
      }

      if (!isLogin && data.pendingVerification) {
        setPassword("");
        setPendingEmail(data.email ?? email);
        setEmailSent(data.emailSent !== false);
        setDevLink(data.devLink ?? null);
        setSubmitting(false);
        return;
      }

      setPassword("");
      const dest = data.user?.role === "ADMIN" && next === "/dashboard" ? "/admin" : next;
      router.push(dest);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="page-top wrap flex min-h-[70vh] items-center justify-center pb-24">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {pendingEmail ? (
          <div>
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span
                className="font-deva text-sm normal-case tracking-normal text-gold"
                aria-hidden="true"
              >
                मन
              </span>
              one last step
            </p>
            <h1 className="h-display text-4xl">
              {emailSent ? "Check your inbox." : "One link stands between us."}
            </h1>
            <p className="mt-4 leading-relaxed text-ink/65">
              {emailSent ? (
                <>
                  We&apos;ve sent a confirmation link to{" "}
                  <span className="font-semibold text-forest-900">{pendingEmail}</span>. Click it to
                  activate your account — the link expires in 24 hours.
                </>
              ) : (
                <>
                  Your account for{" "}
                  <span className="font-semibold text-forest-900">{pendingEmail}</span> is created,
                  but no email could be sent — this server has no mail provider configured yet.
                </>
              )}
            </p>

            {devLink && (
              <div className="mt-6 rounded-2xl border border-gold/40 bg-gold/10 p-5">
                <p className="text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-gold-dark">
                  Development only
                </p>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-ink/70">
                  No mail provider is configured, so here is the link that would have been
                  emailed. Set <code className="font-mono text-[0.8rem]">GMAIL_USER</code> and{" "}
                  <code className="font-mono text-[0.8rem]">GMAIL_APP_PASSWORD</code> in{" "}
                  <code className="font-mono text-[0.8rem]">.env</code> to send it for real.
                </p>
                <a
                  href={devLink}
                  className="mt-4 inline-flex rounded-full bg-forest-800 px-6 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-700"
                >
                  Confirm my email now
                </a>
              </div>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => resend(pendingEmail)}
                className="rounded-full border border-forest-800/20 px-6 py-2.5 text-sm font-semibold text-forest-800 transition-colors hover:border-forest-800 hover:bg-forest-800 hover:text-ivory"
              >
                Resend email
              </button>
              <Link href="/login" className="link-draw text-sm font-medium text-forest-800">
                Back to log in
              </Link>
            </div>
            {resendNote && (
              <p role="status" className="mt-4 text-sm text-forest-600">
                {resendNote}
              </p>
            )}
            <p className="mt-8 text-xs leading-relaxed text-ink/45">
              No email? Check your spam folder, or use &ldquo;Resend&rdquo;. With no mail provider
              configured, the link is printed in the server console and shown above.
            </p>
            <CrisisLine className="mt-10" />
          </div>
        ) : (
          <>
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span
                className="font-deva text-sm normal-case tracking-normal text-gold"
                aria-hidden="true"
              >
                मन
              </span>
              {isLogin ? "welcome back" : "create your account"}
            </p>
            <h1 className="h-display text-4xl">
              {isLogin ? "Good to see you again." : "Let's get you set up."}
            </h1>
            <p className="mt-4 text-ink/65">
              {isLogin
                ? "Log in to manage your sessions and pick up where you left off."
                : "One account for booking sessions, tracking them, and moving them when life happens."}
            </p>

            <form onSubmit={onSubmit} className="mt-9 space-y-4" noValidate>
              {!isLogin && (
                <Field
                  label="Your name"
                  required
                  value={name}
                  onChange={setName}
                  autoComplete="name"
                  disabled={submitting}
                  error={fields.name}
                  placeholder="How should we address you?"
                />
              )}

              <Field
                label="Email"
                required
                type="email"
                inputMode="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                disabled={submitting}
                error={fields.email}
                placeholder="you@example.com"
              />

              <Field
                label="Password"
                required
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete={isLogin ? "current-password" : "new-password"}
                disabled={submitting}
                error={fields.password}
                placeholder={isLogin ? "Your password" : `At least ${PASSWORD_MIN} characters`}
                hint={
                  isLogin
                    ? undefined
                    : "A phrase you'll remember beats a word you won't. Length matters more than symbols."
                }
              />

              {error && (
                <Alert tone="error">
                  <p>{error}</p>
                  {needsVerify && (
                    <button
                      type="button"
                      onClick={() => resend(needsVerify)}
                      className="mt-2 font-semibold underline underline-offset-4"
                    >
                      Resend confirmation email
                    </button>
                  )}
                  {resendNote && <p className="mt-2 font-medium">{resendNote}</p>}
                </Alert>
              )}

              <div className="pt-1">
                <Button type="submit" variant="forest" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <Spinner label={isLogin ? "Logging in…" : "Creating your account…"} />
                  ) : isLogin ? (
                    "Log in"
                  ) : (
                    "Create account"
                  )}
                </Button>
              </div>
            </form>

            <p className="mt-7 text-sm text-ink/60">
              {isLogin ? (
                <>
                  New here?{" "}
                  <Link
                    href={`/signup${rawNext ? `?next=${encodeURIComponent(next)}` : ""}`}
                    className="link-draw font-medium text-forest-800"
                  >
                    Create an account
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link
                    href={`/login${rawNext ? `?next=${encodeURIComponent(next)}` : ""}`}
                    className="link-draw font-medium text-forest-800"
                  >
                    Log in
                  </Link>
                </>
              )}
            </p>

            {!isLogin && (
              <p className="mt-5 text-[0.78rem] leading-relaxed text-ink/45">
                Your account holds your sessions and nothing else. We don&apos;t sell data, and we
                never see what happens inside a session.
              </p>
            )}

            <CrisisLine className="mt-10" />
          </>
        )}
      </motion.div>
    </div>
  );
}
