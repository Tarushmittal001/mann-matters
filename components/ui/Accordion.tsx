"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Faq } from "@/lib/faqs";

export default function Accordion({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-forest-800/10">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              className="group flex w-full items-start justify-between gap-6 py-6 text-left"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${i}`}
              id={`faq-trigger-${i}`}
            >
              <span className="font-display text-xl font-medium text-forest-900 transition-colors group-hover:text-forest-600 md:text-[1.35rem]">
                {item.q}
              </span>
              <span
                className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center text-gold transition-transform duration-500 ease-silk"
                style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                aria-hidden="true"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 0v14M0 7h14" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${i}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-prose pb-7 leading-relaxed text-ink/75">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
