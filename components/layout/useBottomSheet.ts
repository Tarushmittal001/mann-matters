"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * One bottom sheet at a time.
 *
 * Three things want the bottom of the screen on a first visit — the cookie
 * question, the safety note and the install prompt — and on a phone they used
 * to land on top of each other and over the page. Each now asks for its turn,
 * and only the first in ORDER that wants one is shown; the next appears once
 * it is answered or closed.
 *
 *   1. cookies  — asked before anything is measured, so it goes first
 *   2. safety   — the crisis note (the minimised pill does not queue; it is small)
 *   3. install  — the least urgent
 *
 * A sheet that is showing carries `data-bottom-sheet`, which hides the chat
 * and WhatsApp launchers underneath it (globals.css).
 */
export type BottomSheet = "cookies" | "safety" | "install";

const ORDER: BottomSheet[] = ["cookies", "safety", "install"];
const wanting = new Set<BottomSheet>();
const listeners = new Set<() => void>();

function setWants(sheet: BottomSheet, wants: boolean) {
  const had = wanting.has(sheet);
  if (wants === had) return;
  if (wants) wanting.add(sheet);
  else wanting.delete(sheet);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const current = (): BottomSheet | null => ORDER.find((s) => wanting.has(s)) ?? null;

/** Whether `sheet` may show now, given that it `wants` to. */
export function useBottomSheet(sheet: BottomSheet, wants: boolean): boolean {
  useEffect(() => {
    setWants(sheet, wants);
    return () => setWants(sheet, false);
  }, [sheet, wants]);
  const turn = useSyncExternalStore(subscribe, current, () => null);
  return wants && turn === sheet;
}
