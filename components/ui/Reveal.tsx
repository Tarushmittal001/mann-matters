"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLiteMotion } from "@/lib/use-lite-motion";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Direction the element travels in from. `scale` swells instead of sliding. */
export type RevealFrom = "up" | "left" | "right" | "scale";

function offsets(from: RevealFrom, d: number) {
  switch (from) {
    case "left":
      return { x: -d, y: 0, scale: 1 };
    case "right":
      return { x: d, y: 0, scale: 1 };
    case "scale":
      return { x: 0, y: 0, scale: 0.96 };
    default:
      return { x: 0, y: d, scale: 1 };
  }
}

/**
 * Content arriving as it scrolls into view.
 *
 * Short and quick by design: 0.45s over 16px reads as the page keeping up with
 * you, where the old 0.7s over 24px felt like waiting for it. Only opacity and
 * transform move, so the browser can do this on the compositor.
 *
 * `margin` starts the animation slightly before the element reaches the
 * viewport, so nothing is ever caught mid-fade at the bottom of the screen, and
 * reduced motion skips straight to the finished state.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 16,
  from = "up",
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  from?: RevealFrom;
  className?: string;
  once?: boolean;
}) {
  const reduced = useReducedMotion();
  // phones skip the entrance entirely: dozens of these animating during a fast
  // scroll is what actually costs frames there
  const lite = useLiteMotion();
  const { x, y: dy, scale } = offsets(from, y);

  if (reduced || lite) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y: dy, scale }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.45, delay: delay * 0.7, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
