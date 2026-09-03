"use client";

import { MotionConfig } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return (
    <AnalyticsProvider>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </AnalyticsProvider>
  );
}
