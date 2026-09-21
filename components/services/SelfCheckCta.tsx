"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import SelfCheck from "@/components/services/SelfCheck";
import type { Expert } from "@/lib/experts";

/**
 * The button that opens the self-check.
 *
 * Split from the dialog so /services stays a server component: only this
 * wrapper and the dialog ship as client code, and the ten cards, the steps and
 * the rest of the page stay static.
 */
export default function SelfCheckCta({
  children = "Take the self-check",
  variant = "gold",
  className,
  experts,
}: {
  children?: React.ReactNode;
  variant?: "gold" | "outline" | "outline-light";
  className?: string;
  /** The catalogue, read from the database by the page that renders this. */
  experts: Expert[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} variant={variant} className={className}>
        {children}
      </Button>
      <SelfCheck open={open} onClose={() => setOpen(false)} experts={experts} />
    </>
  );
}
