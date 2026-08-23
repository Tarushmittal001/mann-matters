"use client";

import { motion } from "framer-motion";

export default function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3" aria-label="Manu is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-2 w-2 rounded-full bg-forest-600/60"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
