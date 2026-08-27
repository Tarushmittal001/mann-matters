"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useRef, type ReactNode, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

type Variant = "gold" | "forest" | "outline" | "outline-light";

const styles: Record<Variant, string> = {
  gold: "bg-gold text-forest-950 hover:bg-gold-dark",
  forest: "bg-forest-800 text-ivory hover:bg-forest-700",
  outline:
    "border border-forest-800/25 text-forest-800 hover:border-forest-800 hover:bg-forest-800 hover:text-ivory",
  "outline-light":
    "border border-ivory/30 text-ivory hover:border-ivory hover:bg-ivory hover:text-forest-900",
};

export default function Button({
  href,
  onClick,
  children,
  variant = "gold",
  className,
  type,
  disabled,
  external,
  ariaLabel,
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  external?: boolean;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // magnetic pull toward the cursor, eased back on leave
  const onMove = (e: PointerEvent) => {
    const el = ref.current;
    if (!el || reduced || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate(0px, 0px)";
  };

  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[0.95rem] font-semibold tracking-wide transition-colors duration-300",
    styles[variant],
    disabled && "pointer-events-none opacity-50",
    className
  );

  const inner = href ? (
    external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} aria-label={ariaLabel}>
        {children}
      </a>
    ) : (
      <Link href={href} className={cls} aria-label={ariaLabel}>
        {children}
      </Link>
    )
  ) : (
    <button type={type ?? "button"} onClick={onClick} disabled={disabled} className={cls} aria-label={ariaLabel}>
      {children}
    </button>
  );

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      className="inline-block transition-transform duration-300 ease-silk"
    >
      {inner}
    </motion.div>
  );
}
