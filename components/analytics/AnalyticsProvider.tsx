"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

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
];

function canTrack(pathname: string) {
  return !PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  useEffect(() => {
    if (!apiKey || posthog.__loaded) return;
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
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey || !posthog.__loaded || !canTrack(pathname)) return;
    posthog.capture("$pageview", {
      $current_url: `${window.location.origin}${pathname}`,
      path: pathname,
    });
  }, [apiKey, pathname]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}