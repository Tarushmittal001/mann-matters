"use client";

import { useEffect } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { CrisisLine } from "@/components/ui/Feedback";

/**
 * The route-level error boundary.
 *
 * It says what happened in plain language, offers the one action that usually
 * works, and — because this is a mental-health service and a broken page is a
 * bad moment to hit a dead end — keeps the crisis line in reach.
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
    console.error(`[route-error] ${error.digest ?? "no-digest"}`);
  }, [error]);

  return (
    <div className="page-top wrap flex min-h-[60vh] flex-col items-center justify-center pb-28 text-center">
      <p className="eyebrow mb-4">something went wrong</p>
      <h1 className="h-display max-w-lg text-4xl md:text-5xl">
        That didn&apos;t load the way it should have.
      </h1>
      <p className="mt-5 max-w-md leading-relaxed text-ink/65">
        The problem is on our side, not yours. Nothing you&apos;ve booked or paid for is affected —
        trying again usually clears it.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
        <Button onClick={reset} variant="forest">
          Try again
        </Button>
        <Button href="/dashboard" variant="outline">
          Go to my sessions
        </Button>
      </div>

      <p className="mt-6 text-sm text-ink/50">
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
