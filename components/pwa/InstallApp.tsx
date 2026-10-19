"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Registering the service worker, and offering to install.
 *
 * The prompt is not a banner that appears on arrival. Chrome fires
 * `beforeinstallprompt` when it thinks somebody is engaged; we hold onto it and
 * show a small, dismissible line at the bottom, once. A dismissal is
 * remembered for three months, because the second time a site asks to be
 * installed is the time people stop trusting it.
 *
 * iOS has no install event at all, so iPhone users get a short instruction
 * instead — and only if they came here in Safari rather than from the home
 * screen they already have.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const DISMISSED_KEY = "emoraa-install-dismissed";
const QUIET_DAYS = 90;

type Prompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function dismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISSED_KEY) ?? 0);
    return at > 0 && Date.now() - at < QUIET_DAYS * 86_400_000;
  } catch {
    // storage blocked; treat it as never dismissed rather than never offered
    return false;
  }
}

export default function InstallApp() {
  const reduced = useReducedMotion();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    /**
     * The worker is registered whether or not anyone installs: it is what makes
     * the crisis page and the tools work on a dead connection.
     *
     * Production only. In development it installs on every page load and asks
     * for eight pages at once to fill its cache, which a dev server — that
     * compiles one route at a time — cannot answer while somebody is also
     * clicking around. Navigations were being aborted mid-flight. Any worker
     * left over from a dev session is removed here, and its caches with it,
     * so a browser that already has one stops using it.
     */
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          // an unregistered worker costs offline support and nothing else
        });
      } else {
        navigator.serviceWorker
          .getRegistrations()
          .then((rs) => Promise.all(rs.map((r) => r.unregister())))
          .then(() => caches?.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))))
          .catch(() => {
            // nothing registered, or the browser blocks it — either is fine
          });
      }
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // Safari's own flag, which is not in the spec
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone || dismissedRecently()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as Prompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /safari/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent);
    if (isIOS && isSafari) {
      // give them a minute with the site before suggesting anything
      const id = window.setTimeout(() => setIosHint(true), 45_000);
      return () => {
        window.clearTimeout(id);
        window.removeEventListener("beforeinstallprompt", onPrompt);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // not remembered; it will ask once more, which is the tolerable failure
    }
    setPrompt(null);
    setIosHint(false);
  };

  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    dismiss();
  };

  const open = !!prompt || iosHint;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.4, ease: EASE }}
          role="dialog"
          aria-label="Add Emoraa to your home screen"
          className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-md rounded-2xl border border-forest-800/12 bg-ivory-light p-4 shadow-bloom sm:inset-x-auto sm:right-5 sm:bottom-5"
        >
          <div className="flex items-start gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/app/icon-192.png"
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-xl"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[0.95rem] font-semibold text-forest-900">
                Keep Emoraa on your home screen
              </p>
              <p className="mt-1 text-[0.84rem] leading-relaxed text-ink/65">
                {iosHint
                  ? "Tap Share, then “Add to Home Screen”. It opens like an app, and the crisis numbers work without signal."
                  : "It opens like an app, and the crisis page keeps working without signal."}
              </p>

              <div className="mt-3 flex items-center gap-4">
                {!iosHint && (
                  <button
                    type="button"
                    onClick={install}
                    className="press rounded-full bg-forest-800 px-4 py-2 text-[0.85rem] font-semibold text-ivory transition-colors hover:bg-forest-700"
                  >
                    Add it
                  </button>
                )}
                <button
                  type="button"
                  onClick={dismiss}
                  className="link-draw text-[0.84rem] font-medium text-ink/70"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
