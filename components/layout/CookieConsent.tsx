"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OPEN_SETTINGS_EVENT, readConsent, writeConsent, type Consent } from "@/lib/consent";
import { useBottomSheet } from "@/components/layout/useBottomSheet";
import { useLocale } from "@/lib/i18n/client";
import { chromeCopy } from "@/lib/i18n/chrome";

/**
 * Asks once before any analytics runs. Both choices are equally easy — a
 * single button each, same size — because a consent that is harder to refuse
 * than to give isn't freely given under the DPDP Act. "Cookie settings" in the
 * footer reopens it.
 */
export default function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // read after mount: localStorage doesn't exist during the server render
    if (readConsent() === null) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, reopen);
  }, []);

  // first in the queue: asked before anything is measured
  const myTurn = useBottomSheet("cookies", open);
  const locale = useLocale();
  const c = chromeCopy(locale).cookies;
  if (!myTurn) return null;

  const choose = (value: Consent) => {
    writeConsent(value);
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      data-bottom-sheet
      lang={locale}
      aria-labelledby="cookie-title"
      aria-describedby="cookie-body"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[70] mx-auto max-w-md rounded-2xl border border-forest-800/12 bg-ivory-light p-5 shadow-bloom sm:inset-x-auto sm:bottom-6 sm:left-6"
    >
      <p id="cookie-title" className="font-semibold text-forest-900">
        {c.title}
      </p>
      <p id="cookie-body" className="mt-2 text-sm leading-relaxed text-ink/75">
        {c.body}{" "}
        <Link href="/cookies" className="font-medium text-forest-800 underline underline-offset-2">
          {c.policy}
        </Link>
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => choose("denied")}
          className="min-h-11 rounded-full border border-forest-800/25 px-4 text-sm font-semibold text-forest-800 transition-colors hover:bg-forest-800/5"
        >
          {c.essential}
        </button>
        <button
          type="button"
          onClick={() => choose("granted")}
          className="min-h-11 rounded-full bg-forest-800 px-4 text-sm font-semibold text-ivory transition-colors hover:bg-forest-900"
        >
          {c.allow}
        </button>
      </div>
    </div>
  );
}
