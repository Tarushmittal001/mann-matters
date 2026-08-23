"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useRef, type ReactNode, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

type Variant = "sunrise" | "gold" | "forest" | "outline" | "outline-light";

/* `sunrise` is the primary call to action. The gradient is twice the width
   of the button and slides on hover, so the colour moves instead of the
   button changing colour. Every stop it can land on clears 4.5:1 against
   forest-950 — the purple end of the family deliberately isn't in here. */
const styles: Record<Variant, string> = {
  sunrise:
    "bg-sunrise bg-[length:200%_100%] bg-left text-forest-950 shadow-kesar hover:bg-right",
  gold: "bg-gold text-forest-950 hover:bg-gold-dark",
  forest: "bg-forest-800 text-ivory hover:bg-forest-700",
  outline:
    "border border-forest-800/30 text-forest-800 hover:border-gulaal hover:bg-gulaal hover:text-white",
  "outline-light":
    "border border-ivory/30 text-ivory hover:border-haldi hover:bg-haldi hover:text-forest-950",
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
    "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[0.95rem] font-semibold tracking-wide transition-[background-position,background-color,color,border-color,box-shadow] duration-500 ease-silk",
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
