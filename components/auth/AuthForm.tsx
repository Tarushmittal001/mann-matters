"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

const EASE = [0.22, 1, 0.36, 1] as const;

const inputCls =
  "w-full rounded-xl border border-forest-800/15 bg-ivory-light px-4 py-3 text-[0.95rem] text-forest-900 placeholder:text-ink/35 transition-colors duration-300 focus:border-forest-800 focus:outline-none";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next");
  // only follow internal redirects
  const next = rawNext && rawNext.startsWith("/") ? rawNext : "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // set after a successful signup — show the "check your inbox" screen
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  // set when login is blocked because the email isn't confirmed yet
  const [needsVerify, setNeedsVerify] = useState<string | null>(null);
  const [resendNote, setResendNote] = useState("");

  const isLogin = mode === "login";

  const resend = async (target: string) => {
    setResendNote("Sending…");
    try {
      await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target }),
      });
      setResendNote("Sent! Check your inbox (and spam).");
    } catch {
      setResendNote("Couldn't resend just now. Please try again.");
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setNeedsVerify(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isLogin ? { email, password } : { name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (isLogin && data.needsVerification) setNeedsVerify(data.email ?? email);
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      // signup now waits for email confirmation instead of logging in
      if (!isLogin && data.pendingVerification) {
        setPendingEmail(data.email ?? email);
        setSubmitting(false);
        return;
      }

      const dest = data.user.role === "ADMIN" && next === "/dashboard" ? "/admin" : next;
      router.push(dest);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
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
              <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
              one last step
            </p>
            <h1 className="h-display text-4xl">Check your inbox.</h1>
            <p className="mt-4 leading-relaxed text-ink/65">
              We&apos;ve sent a confirmation link to{" "}
              <span className="font-semibold text-forest-900">{pendingEmail}</span>. Click it to
              activate your account — the link expires in 24 hours.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => resend(pendingEmail)}
                className="rounded-full border border-forest-800/20 px-6 py-2.5 text-sm font-semibold text-forest-800 transition-colors hover:border-forest-800 hover:bg-forest-800 hover:text-ivory"
              >
                Resend email
              </button>
              <Link href="/login" className="link-draw text-sm font-medium text-forest-800">
                Back to log in
              </Link>
            </div>
            {resendNote && <p className="mt-4 text-sm text-forest-600">{resendNote}</p>}
            <p className="mt-8 text-xs leading-relaxed text-ink/45">
              No email? Check your spam folder, or use “Resend.” In local development the link is
              printed in the server console.
            </p>
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
            : "One account for booking sessions, tracking them, and rescheduling when life happens."}
        </p>

        <form onSubmit={onSubmit} className="mt-9 space-y-4" noValidate>
          {!isLogin && (
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-forest-900">
                Your name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="How should we address you?"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-forest-900">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-forest-900">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder={isLogin ? "Your password" : "At least 8 characters"}
            />
          </div>

          {error && (
            <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <p>{error}</p>
              {needsVerify && (
                <button
                  type="button"
                  onClick={() => resend(needsVerify)}
                  className="mt-2 font-semibold text-red-800 underline underline-offset-4"
                >
                  Resend confirmation email
                </button>
              )}
              {resendNote && <p className="mt-2 font-medium text-forest-700">{resendNote}</p>}
            </div>
          )}

          <Button type="submit" variant="forest" className="w-full" disabled={submitting}>
            {submitting
              ? isLogin
                ? "Logging in…"
                : "Creating your account…"
              : isLogin
                ? "Log in"
                : "Create account"}
          </Button>
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
          </>
        )}
      </motion.div>
    </div>
  );
}
