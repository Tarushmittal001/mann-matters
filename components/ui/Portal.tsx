"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renders its children straight into <body>.
 *
 * For dialogs. A `fixed` layer rendered inside an animated section (Reveal,
 * anything with a transform) is positioned and stacked inside that section, so
 * no z-index can lift it above the fixed navbar — its close button ended up
 * under the nav. From <body> the dialog's own z-index is the only one that counts.
 */
export default function Portal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}
