"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

/**
 * A hairline of gold across the top of the article, and — once you're past the
 * headline — the minutes you have left. Both read from the same scroll.
 */
export default function ReadingProgress({ readTime }: { readTime: string }) {
  const ref = useRef<HTMLElement | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const { scrollYProgress } = useScroll();
  const width = useSpring(scrollYProgress, { stiffness: 90, damping: 24, restDelta: 0.001 });

  // total minutes, parsed out of "7 min read"
  const total = parseInt(readTime, 10) || 0;

  useEffect(() => {
    ref.current = document.querySelector("article");
    return scrollYProgress.on("change", (v) => {
      setMinutes(v < 0.06 || v > 0.99 ? null : Math.max(1, Math.round(total * (1 - v))));
    });
  }, [scrollYProgress, total]);

  return (
    <>
      <motion.div
        className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gold"
        style={{ scaleX: width }}
        aria-hidden="true"
      />
      <motion.p
        className="fixed bottom-6 left-6 z-[55] hidden rounded-full border border-forest-800/10 bg-ivory-light/90 px-4 py-2 text-xs font-medium text-ink/60 shadow-lift backdrop-blur lg:block"
        animate={{ opacity: minutes === null ? 0 : 1, y: minutes === null ? 8 : 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden={minutes === null}
      >
        {minutes ?? 0} min left
      </motion.p>
    </>
  );
}
