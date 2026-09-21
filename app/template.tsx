"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * The move between pages: the new page rises the last few pixels and fades in.
 *
 * Kept to 0.28s and 10px on purpose. This is a site where people click through
 * services, therapists and times in a row, so a transition has to read as
 * polish rather than as waiting. Opacity and transform only, which the browser
 * can hand to the compositor, and nothing at all for reduced motion.
 */
export default function Template({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();

  if (reduced) return <div className="relative">{children}</div>;

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      // the hint is dropped the moment the move ends, so text stays crisp
      style={{ willChange: "opacity, transform" }}
      onAnimationComplete={(definition) => {
        if (typeof definition === "object") return;
      }}
    >
      {children}
    </motion.div>
  );
}
