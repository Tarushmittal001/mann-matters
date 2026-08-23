"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function VerifyClient() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard React 18 strict double-run
    ran.current = true;

    if (!token) {
      setState("error");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          setState("error");
          return;
        }
        setState("done");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1400);
      } catch {
        setState("error");
      }
    })();
  }, [token, router]);

  return (
    <motion.div
      className="w-full max-w-md text-center"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <p className="eyebrow mb-4 flex items-center justify-center gap-3">
        <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
        email confirmation
      </p>

      {state === "working" && (
        <>
          <h1 className="h-display text-3xl">Confirming your email…</h1>
          <p className="mt-4 text-ink/65">One moment while we set everything up.</p>
        </>
      )}

      {state === "done" && (
        <>
          <h1 className="h-display text-3xl">You&apos;re all set. 🌿</h1>
          <p className="mt-4 text-ink/65">
            Your email is confirmed. Taking you to your dashboard…
          </p>
        </>
      )}

      {state === "error" && (
        <>
          <h1 className="h-display text-3xl">This link didn&apos;t work.</h1>
          <p className="mt-4 text-ink/65">
            It may have expired or already been used. Log in to request a fresh confirmation email.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-full bg-forest-800 px-7 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-forest-700"
          >
            Go to log in
          </Link>
        </>
      )}
    </motion.div>
  );
}
