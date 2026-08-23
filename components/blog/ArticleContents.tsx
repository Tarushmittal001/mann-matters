"use client";

import { useEffect, useState } from "react";

/**
 * The contents list that rides alongside the essay, marking where you are.
 * Anchors do the navigating — the observer only decides what looks current.
 */
export default function ArticleContents({
  headings,
}: {
  headings: { id: string; text: string }[];
}) {
  const [active, setActive] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    if (!headings.length) return;
    const nodes = headings
      .map((h) => document.getElementById(h.id))
      .filter((n): n is HTMLElement => Boolean(n));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [headings]);

  // With a single heading a contents list is decoration, not navigation.
  if (headings.length < 2) return null;

  return (
    <nav aria-label="In this article">
      <p className="eyebrow mb-4">In this piece</p>
      <ul className="space-y-1 border-l border-forest-800/10">
        {headings.map((h) => {
          const on = h.id === active;
          return (
            <li key={h.id}>
              <a
                href={"#" + h.id}
                aria-current={on ? "true" : undefined}
                className={
                  "-ml-px block border-l-2 py-1.5 pl-4 text-[0.85rem] leading-snug transition-colors duration-300 " +
                  (on
                    ? "border-gold font-medium text-forest-900"
                    : "border-transparent text-ink/50 hover:border-forest-800/30 hover:text-forest-800")
                }
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
