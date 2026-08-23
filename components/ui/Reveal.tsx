"use client";

import { motion } from "framer-motion";
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
      return { x: 0, y: 0, scale: 0.94 };
    default:
      return { x: 0, y: d, scale: 1 };
  }
}

export default function Reveal({
  children,
  delay = 0,
  y = 24,
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
  const { x, y: dy, scale } = offsets(from, y);

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y: dy, scale }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once, margin: "-12% 0px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
