"use client";

import { MotionConfig } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /*
     * Smooth scrolling is a desktop luxury. On a phone it replaces the
     * browser's own momentum scrolling — which the compositor handles on its
     * own thread — with a scroll position rewritten from JavaScript every
     * frame. Measured on a 4x-throttled phone, that halved the frame rate
     * (16-19fps against 36 with it off), for a gesture Android and iOS already
     * do better than we can.
     */
    const lite =
      window.matchMedia("(max-width: 1023px)").matches ||
      window.matchMedia("(pointer: coarse)").matches;
    if (lite) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      // Lenis takes every wheel event for the page, so a scrollable form in a
      // dialog wouldn't move. Inside a dialog, or any box that scrolls on its
      // own, the browser scrolls natively instead.
      prevent: (node) => node.getAttribute("aria-modal") === "true",
      allowNestedScroll: true,
    });

    // A dialog locks the page with body overflow:hidden. That alone does
    // nothing here: <html> has overflow-x: clip (globals.css), which stops the
    // body's overflow reaching the viewport. So the lock is mirrored onto
    // <html>, and Lenis pauses, or the page behind scrolls under the dialog.
    const html = document.documentElement;
    const syncLock = () => {
      if (document.body.style.overflow === "hidden") {
        html.style.overflowY = "hidden";
        lenis.stop();
      } else {
        html.style.overflowY = "";
        lenis.start();
      }
    };
    const lockWatch = new MutationObserver(syncLock);
    lockWatch.observe(document.body, { attributes: true, attributeFilter: ["style"] });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lockWatch.disconnect();
      lenis.destroy();
    };
  }, []);

  return (
    <AnalyticsProvider>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </AnalyticsProvider>
  );
}
