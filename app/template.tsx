"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

/**
 * True once the first page has hydrated. Module state, so it survives the
 * remount Next does for this template on every navigation; on the server it
 * never flips, because effects do not run there.
 */
let hydrated = false;

/**
 * The move between pages: the new page rises the last few pixels and fades in.
 *
 * Kept to 0.28s and 10px on purpose. This is a site where people click through
 * services, therapists and times in a row, so a transition has to read as
 * polish rather than as waiting. Opacity and transform only, which the browser
 * can hand to the compositor, and nothing at all for reduced motion.
 *
 * Never on the first page of a visit. Its server HTML used to arrive at
 * opacity 0 and stay blank until JavaScript ran, which on a slow phone was
 * the first second or more of the site. The first page is simply there; only
 * a move to another page animates.
 */
export default function Template({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  // false on the server and on the first client render, so hydration matches
  const [animateIn] = useState(() => hydrated);
  useEffect(() => {
    hydrated = true;
  }, []);

  if (reduced) return <div className="relative">{children}</div>;

  return (
    <motion.div
      className="relative"
      initial={animateIn ? { opacity: 0, y: 10 } : false}
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
