"use client";

import { useState } from "react";
import PackBuilder from "@/components/organisations/PackBuilder";
import { cn } from "@/lib/utils";

/**
 * A button that opens the pack composer. Used for the page-level calls to
 * action, where no institution type is pre-selected yet.
 *
 * This replaces a `mailto:` link that opened a template someone had to fill in
 * themselves — and that silently did nothing on any device without a configured
 * mail client, which is most phones.
 */
export default function PackCta({
  children,
  variant = "gold",
  className,
}: {
  children: React.ReactNode;
  variant?: "gold" | "outline" | "outline-light";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const styles = {
    gold: "bg-gold text-forest-950 hover:bg-gold-dark",
    outline:
      "border border-forest-800/25 text-forest-800 hover:border-forest-800 hover:bg-forest-800 hover:text-ivory",
    "outline-light":
      "border border-ivory/30 text-ivory hover:border-ivory hover:bg-ivory hover:text-forest-900",
  }[variant];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[0.95rem] font-semibold tracking-wide transition-colors duration-300",
          styles,
          className
        )}
      >
        {children}
      </button>
      <PackBuilder open={open} onClose={() => setOpen(false)} />
    </>
  );
}
