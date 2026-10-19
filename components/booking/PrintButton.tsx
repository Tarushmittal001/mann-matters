"use client";

import { useEffect, useRef } from "react";

/**
 * Printing is a browser action, so this one button is the only client code a
 * receipt needs. With `auto`, the dialog opens on its own — that is what the
 * "Download receipt" button on the confirmation screen links to, so the person
 * lands on the receipt with Save as PDF already waiting.
 */
export default function PrintButton({ label = "Print", auto = false }: { label?: string; auto?: boolean }) {
  const fired = useRef(false);
  useEffect(() => {
    if (!auto) return;
    // A short wait so the sheet is painted before the dialog covers it.
    // The guard is checked when the timer fires, not when it is scheduled:
    // React runs effects twice in development, and guarding at schedule time
    // meant the second run cancelled the timer and never set another.
    const id = window.setTimeout(() => {
      if (fired.current) return;
      fired.current = true;
      window.print();
    }, 600);
    return () => window.clearTimeout(id);
  }, [auto]);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="press rounded-full bg-forest-800 px-6 py-2.5 text-[0.9rem] font-semibold text-ivory transition-colors hover:bg-forest-700"
    >
      {label}
    </button>
  );
}
