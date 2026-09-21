"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
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
  const reduced = useReducedMotion();

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

  /*
   * The same small answer on every button: it lifts a little under the cursor
   * and presses in when tapped. This replaced a magnetic pull toward the
   * cursor — clever on a desktop, invisible on a phone, and restless on a page
   * that is trying to be calm.
   */
  return (
    <motion.div
      className="inline-block"
      whileHover={reduced || disabled ? undefined : { y: -2 }}
      whileTap={reduced || disabled ? undefined : { scale: 0.97, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.6 }}
    >
      {inner}
    </motion.div>
  );
}
