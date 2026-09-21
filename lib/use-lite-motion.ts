"use client";

import { useEffect, useState } from "react";

/**
 * True on the devices that can least afford decoration: phones, touch devices
 * with few cores, and anyone on a data saver.
 *
 * Measured on a home page throttled to a quarter of this machine's speed,
 * running every entrance and looping animation cost about half the frame rate
 * (16-19fps against 36 with them off). A phone scrolls fast and holds less of
 * the page on screen at once, so the reveals are the first thing worth giving
 * up there — the layout, the colour and the interactions are identical.
 *
 * Starts false so the server and the first paint agree, then settles on mount.
 */
export function useLiteMotion(): boolean {
  const [lite, setLite] = useState(false);

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 767px)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const judge = () => {
      const fewCores = (navigator.hardwareConcurrency ?? 8) <= 4;
      const saveData =
        (navigator as { connection?: { saveData?: boolean } }).connection?.saveData === true;
      setLite(narrow.matches || (coarse.matches && fewCores) || saveData);
    };
    judge();
    narrow.addEventListener("change", judge);
    coarse.addEventListener("change", judge);
    return () => {
      narrow.removeEventListener("change", judge);
      coarse.removeEventListener("change", judge);
    };
  }, []);

  return lite;
}
