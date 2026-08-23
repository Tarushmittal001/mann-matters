"use client";

import { useState } from "react";

/**
 * Sharing, in the order Indians actually share: WhatsApp first, then a link.
 * The URL is read at click time so it is right in every environment.
 */
export default function ShareRow({ title, className }: { title: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const url = () => (typeof window === "undefined" ? "" : window.location.href);

  const whatsapp = () => {
    const text = encodeURIComponent(title + "\n\n" + url());
    window.open("https://wa.me/?text=" + text, "_blank", "noopener,noreferrer");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={"flex flex-wrap items-center gap-2.5 " + (className ?? "")}>
      <span className="mr-1 text-xs uppercase tracking-[0.18em] text-ink/40">Share</span>

      <button
        type="button"
        onClick={whatsapp}
        className="inline-flex items-center gap-2 rounded-full border border-forest-800/15 px-4 py-2 text-sm font-medium text-forest-800 transition-colors hover:border-forest-800 hover:bg-forest-800 hover:text-ivory"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2c-5.5 0-9.94 4.44-9.94 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.49 0 9.94-4.44 9.94-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.16c-.24.68-1.42 1.32-1.96 1.36-.5.05-1.14.07-1.84-.11-.42-.13-.97-.31-1.66-.61-2.93-1.26-4.84-4.2-4.99-4.4-.14-.2-1.19-1.58-1.19-3.02 0-1.43.75-2.13 1.02-2.43.27-.29.58-.36.78-.36l.55.01c.18 0 .42-.07.65.5.24.59.82 2.02.89 2.17.07.14.12.31.02.5-.09.2-.14.31-.28.48-.14.16-.29.37-.42.49-.14.14-.28.29-.12.57.16.27.71 1.17 1.53 1.9 1.05.93 1.93 1.22 2.21 1.36.27.14.43.12.59-.07.16-.2.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.61.76 1.88.9.27.14.46.2.53.32.07.11.07.66-.17 1.34Z" />
        </svg>
        WhatsApp
      </button>

      <button
        type="button"
        onClick={copy}
        aria-live="polite"
        className="inline-flex items-center gap-2 rounded-full border border-forest-800/15 px-4 py-2 text-sm font-medium text-forest-800 transition-colors hover:border-forest-800 hover:bg-forest-800 hover:text-ivory"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          {copied ? (
            <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <>
              <path d="M10 13.5a4 4 0 0 0 5.7.2l2.6-2.6a4 4 0 0 0-5.7-5.7l-1.3 1.3" strokeLinecap="round" />
              <path d="M14 10.5a4 4 0 0 0-5.7-.2l-2.6 2.6a4 4 0 0 0 5.7 5.7l1.3-1.3" strokeLinecap="round" />
            </>
          )}
        </svg>
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
