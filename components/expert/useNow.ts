"use client";

import { useEffect, useState } from "react";

/**
 * A clock that starts on the server's instant and then ticks locally.
 *
 * Join windows and countdowns are the one thing in the portal that must not go
 * stale on a tab left open since morning. Seeding from `serverNow` keeps the
 * first client render byte-identical to the server's, so nothing re-renders as
 * a hydration mismatch.
 */
export function useNow(serverNow: string, intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date(serverNow));

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
