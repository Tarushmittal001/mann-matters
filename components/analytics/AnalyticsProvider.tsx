"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { CONSENT_EVENT, readConsent, type Consent } from "@/lib/consent";

const PRIVATE_PREFIXES = [
  "/admin",
  "/api",
  "/book",
  "/crisis",
  "/dashboard",
  "/expert",
  "/login",
  "/signup",
  "/verify",
  // the standalone tools: which one somebody opened is a health signal
  "/breathe",
  "/check-in",
  "/match",
];

/**
 * Paths that are private even though their parent is not.
 *
 * `/tools` is the menu and may be counted — knowing how many people reach the
 * tools at all is useful and tells us nothing about any of them. A page BELOW
 * it is different: "this visitor opened the worry journal" or "…the grounding
 * exercise" is a fact about someone's mental health, and PRODUCT.md is explicit
 * that those never reach analytics. The /tools page also promises no tracking,
 * so counting them made that line untrue.
 */
const PRIVATE_PATTERNS = [/^\/tools\/.+/];

function canTrack(pathname: string) {
  if (
    PRIVATE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return false;
  }
  return !PRIVATE_PATTERNS.some((re) => re.test(pathname));
}

export default function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  // nothing loads until the visitor says yes in the cookie banner
  const [consent, setConsent] = useState<Consent | null>(null);

  useEffect(() => {
    setConsent(readConsent());
    const onChange = (e: Event) => setConsent((e as CustomEvent<Consent>).detail);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    if (consent !== "granted") {
      // a yes taken back: stop capturing and clear what PostHog stored
      if (posthog.__loaded) {
        posthog.opt_out_capturing();
        posthog.reset();
      }
      return;
    }
    if (posthog.__loaded) {
      posthog.opt_in_capturing();
      return;
    }
    posthog.init(apiKey, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      capture_pageview: false,
      capture_pageleave: false,
      autocapture: false,
      disable_session_recording: true,
      person_profiles: "identified_only",
      respect_dnt: true,
      persistence: "localStorage",
    });
  }, [apiKey, consent]);

  useEffect(() => {
    if (!apiKey || consent !== "granted" || !posthog.__loaded || !canTrack(pathname)) return;
    posthog.capture("$pageview", {
      $current_url: `${window.location.origin}${pathname}`,
      path: pathname,
    });
  }, [apiKey, consent, pathname]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}