"use client";

import { openCookieSettings } from "@/lib/consent";

/** Reopens the cookie banner so a choice can be changed at any time. */
export default function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      Cookie settings
    </button>
  );
}
