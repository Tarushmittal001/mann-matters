"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import Button from "@/components/ui/Button";
import { CrisisLine } from "@/components/ui/Feedback";

/**
 * The route-level error boundary.
 *
 * It says what happened in plain language, offers the one action that usually
 * works, and — because this is a mental-health service and a broken page is a
 * bad moment to hit a dead end — keeps the crisis line in reach.
 *
 * What it promises depends on who is reading. "Nothing you've booked or paid
 * for is affected" and "Go to my sessions" mean nothing to someone who has
 * never booked, so they appear only once /api/auth/me says someone is signed
 * in; if that call fails too, the anonymous version is the safe one.
 *
 * `error.digest` is the server-side correlation id. The message itself is never
 * rendered: it can carry internals, and it's never useful to the person reading.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error(`[route-error] ${error.digest ?? "no-digest"}`);
  }, [error]);

  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setRole(data?.user?.role ?? null))
      .catch(() => setRole(null));
  }, []);

  const home =
    role === "ADMIN"
      ? { href: "/admin", label: "Go to admin" }
      : role === "EXPERT"
        ? { href: "/expert", label: "Go to my sessions" }
        : role
          ? { href: "/dashboard", label: "Go to my sessions" }
          : { href: "/", label: "Go to the home page" };

  return (
    <div className="page-top wrap flex min-h-[60vh] flex-col items-center justify-center pb-28 text-center">
      <p className="eyebrow mb-4">something went wrong</p>
      <h1 className="h-display max-w-lg text-4xl md:text-5xl">
        That didn&apos;t load the way it should have.
      </h1>
      <p className="mt-5 max-w-md leading-relaxed text-ink/70">
        The problem is on our side, not yours.{" "}
        {role && <>Nothing you&apos;ve booked or paid for is affected — </>}
        {role ? "trying" : "Trying"} again usually clears it.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
        <Button onClick={reset} variant="forest">
          Try again
        </Button>
        <Button href={home.href} variant="outline">
          {home.label}
        </Button>
      </div>

      <p className="mt-6 text-sm text-ink/70">
        Still stuck?{" "}
        <Link href="/contact" className="link-draw font-medium text-forest-800">
          Tell us what happened
        </Link>
        {error.digest && (
          <>
            {" "}
            and quote <span className="font-mono text-[0.8rem]">{error.digest}</span>.
          </>
        )}
      </p>

      <CrisisLine className="mt-12 justify-center" />
    </div>
  );
}
