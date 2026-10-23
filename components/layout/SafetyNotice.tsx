"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBottomSheet } from "@/components/layout/useBottomSheet";
import { useLocale } from "@/lib/i18n/client";
import { chromeCopy } from "@/lib/i18n/chrome";

type NoticeState = "full" | "minimized" | "dismissed";

/** Remembered for the browser session, so a choice is not undone on every page. */
const KEY = "emoraa:safety-notice";

/*
 * The site-wide note about crisis support.
 *
 * It used to interrupt (role="alert") on every page load and come back on
 * every page after being closed. Now it is a polite status, and closing or
 * shrinking it holds for the session. Crisis help stays one tap away
 * everywhere regardless: the nav and the footer both carry Tele-MANAS 14416
 * and /crisis, which is what the hard rule in CLAUDE.md requires.
 */
export default function SafetyNotice() {
  // null until mounted: the stored choice is only readable in the browser, and
  // deciding before then would flash the banner at someone who closed it
  const [state, setStateRaw] = useState<NoticeState | null>(null);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.sessionStorage.getItem(KEY);
    } catch {
      // storage blocked (private mode, settings): show it, as before
    }
    setStateRaw(saved === "minimized" || saved === "dismissed" ? saved : "full");
  }, []);

  const setState = (next: NoticeState) => {
    setStateRaw(next);
    try {
      window.sessionStorage.setItem(KEY, next);
    } catch {
      // the choice still holds on this page
    }
  };

  // the full note queues behind the cookie question; the small pill never waits
  const myTurn = useBottomSheet("safety", state === "full");
  const locale = useLocale();
  const c = chromeCopy(locale).safety;
  if (state === null || state === "dismissed") return null;
  if (state === "full" && !myTurn) return null;

  return (
    <AnimatePresence>
      {state === "minimized" ? (
        <motion.button
          key="pill"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={() => setState("full")}
          data-safety-notice
          className="fixed bottom-20 left-[max(1rem,env(safe-area-inset-left))] z-50 flex min-h-11 items-center gap-2 rounded-full bg-forest-100 px-4 py-2 text-small font-semibold text-forest-800 shadow-bloom border border-forest-600/20 hover:bg-sage-light transition-colors"
          aria-label={c.pillLabel}
          lang={locale}
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-forest-600 shrink-0" aria-hidden="true">
            <path fillRule="evenodd" d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1ZM5.05 3.05a.75.75 0 0 1 1.06 0l1.062 1.06a.75.75 0 1 1-1.06 1.06L5.05 4.11a.75.75 0 0 1 0-1.06Zm9.9 0a.75.75 0 0 1 0 1.06l-1.062 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-6.25 3a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5H3a.75.75 0 0 1 .75.75Zm14 0a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5H17a.75.75 0 0 1 .75.75Zm-11.89 3.89a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm8.84 0a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM10 16a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 16Z" clipRule="evenodd" />
          </svg>
          {c.pill}
        </motion.button>
      ) : (
        <>
          <motion.div
            key="mobile-banner"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            role="status"
            aria-label={c.region}
            lang={locale}
            data-safety-notice
            className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 z-50 rounded-2xl border border-forest-600/15 bg-ivory/95 p-4 shadow-bloom backdrop-blur-md sm:hidden"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-100">
                <svg viewBox="0 0 20 20" className="h-4 w-4 fill-forest-700" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-body font-medium leading-tight text-forest-900">
                  {c.region}
                </p>
                <p className="mt-1 text-small leading-relaxed text-ink/70">
                  {c.short}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <a
                href="tel:14416"
                className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-forest px-4 text-small font-semibold text-ivory"
              >
                {c.call}
              </a>
              <a
                href={`${locale === "hi" ? "/hi/crisis" : "/crisis"}?sos=true`}
                className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-forest-600/20 bg-ivory-light px-4 text-small font-semibold text-forest-800"
              >
                {c.more}
              </a>
              <button
                type="button"
                onClick={() => setState("dismissed")}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink/70 ring-1 ring-inset ring-forest-600/20"
                aria-label={c.dismissLabel}
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </motion.div>

          <motion.div
          key="banner"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          role="status"
          aria-label={c.region}
            lang={locale}
          data-safety-notice
          className="fixed bottom-6 left-6 right-6 z-50 mx-auto hidden max-w-2xl rounded-2xl border border-forest-600/15 bg-ivory/95 p-5 shadow-bloom backdrop-blur-md sm:block"
        >
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-100">
              <svg viewBox="0 0 20 20" className="h-4 w-4 fill-forest-700" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
              </svg>
            </span>
            <div>
              <p className="font-display text-body font-medium text-forest-900">{c.gentle}</p>
              <p className="mt-1.5 text-small text-ink/70 leading-relaxed">
                {c.bodyBefore}
                <strong className="text-forest-800">{c.bodyStrong}</strong>
                {c.bodyAfter}
              </p>
            </div>
          </div>

          {/* Crisis box */}
          <div className="rounded-xl bg-forest-950/[0.04] border border-forest-600/10 px-4 py-3 mb-4">
            <p className="flex items-center gap-2 text-small font-semibold text-forest-800 mb-2">
              <svg viewBox="0 0 20 20" className="h-4 w-4 fill-forest-600 shrink-0" aria-hidden="true">
                <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.694.198-.933.74-.897 1.116a7.02 7.02 0 0 0 6.505 6.505c.376.036.918-.203 1.116-.897l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 3.43 8.326 13.02 13.02 0 0 1 3 5H3.5A1.5 1.5 0 0 1 2 3.5Z" clipRule="evenodd" />
              </svg>
              {c.reachOut}
            </p>
            <ul className="space-y-1 text-small text-ink/70">
              <li>
                <span className="font-semibold text-forest-800">Tele-MANAS:</span>{" "}
                <a href="tel:14416" className="text-gold-dark underline underline-offset-2 hover:text-gold">14416</a>{" "}
                <span className="text-ink/70">{c.teleManasNote}</span>
              </li>
              <li>
                <span className="font-semibold text-forest-800">iCALL:</span>{" "}
                <a href="tel:9152987821" className="text-gold-dark underline underline-offset-2 hover:text-gold">9152987821</a>
              </li>
              <li>
                <span className="font-semibold text-forest-800">{c.emergency}</span>{" "}
                <a href="tel:112" className="text-gold-dark underline underline-offset-2 hover:text-gold">112</a>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setState("dismissed")}
              className="min-h-11 rounded-full bg-forest px-5 py-2 text-small font-semibold text-ivory hover:bg-forest-700 transition-colors"
            >
              {c.gotIt}
            </button>
            <button
              onClick={() => setState("minimized")}
              className="min-h-11 rounded-full border border-forest-600/20 bg-ivory-light px-5 py-2 text-small font-semibold text-forest-800 hover:bg-sage-light transition-colors"
            >
              {c.minimize}
            </button>
            <span className="text-small text-ink/70 italic">
              {c.safetyFirst}
            </span>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
