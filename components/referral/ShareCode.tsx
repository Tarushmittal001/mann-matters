"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { formatINR } from "@/lib/utils";

/**
 * The code itself, big enough to read across a room, with the two things
 * anybody actually does with it: copy it, or send it.
 *
 * The share sheet is used where the browser has one — on a phone, which is
 * where this gets used — and quietly falls back to copying where it doesn't.
 * The message is pre-written because "here, use my code" is a surprisingly
 * hard sentence to write about therapy.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export default function ShareCode({
  code,
  url,
  value,
}: {
  code: string;
  url: string;
  value: number;
}) {
  const reduced = useReducedMotion();
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const message = `I've been using Emoraa for therapy. Use my code ${code} and you get ${formatINR(
    value
  )} off your first session: ${url}`;

  const copy = async (text: string, what: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      window.setTimeout(() => setCopied(null), 2200);
    } catch {
      // clipboard blocked; the code is on screen to copy by hand
    }
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "Emoraa", text: message, url });
        return;
      } catch {
        // dismissed, or unsupported on this content — fall through to copying
      }
    }
    void copy(message, "link");
  };

  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="rounded-3xl border border-forest-800/10 bg-ivory-light p-8 shadow-lift sm:p-10"
    >
      <p className="eyebrow mb-5">your code</p>

      <div className="rounded-2xl border border-dashed border-gold/60 bg-gold/[0.07] px-6 py-8 text-center">
        <p className="break-all font-display text-3xl font-medium tracking-wide text-forest-900 sm:text-4xl">
          {code}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => copy(code, "code")}
          className="press rounded-full bg-forest-800 px-6 py-3 text-[0.92rem] font-semibold text-ivory transition-colors hover:bg-forest-700"
        >
          {copied === "code" ? "Copied" : "Copy code"}
        </button>
        <button
          type="button"
          onClick={share}
          className="press rounded-full border border-forest-800/25 px-6 py-3 text-[0.92rem] font-semibold text-forest-800 transition-colors hover:border-forest-800"
        >
          {copied === "link" ? "Message copied" : "Share it"}
        </button>
      </div>

      <div className="mt-7 rounded-2xl bg-forest-800/[0.04] px-5 py-4">
        <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink/70">
          What they&apos;ll get
        </p>
        <p className="mt-2 text-[0.92rem] leading-relaxed text-ink/70">&ldquo;{message}&rdquo;</p>
      </div>
    </motion.section>
  );
}
