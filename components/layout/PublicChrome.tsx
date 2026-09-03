"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * The client-facing furniture — footer, newsletter, WhatsApp bubble, chat
 * assistant, safety banner — belongs on the pages clients read. Inside the
 * expert portal it is noise, and worse: three of those float over the bottom
 * of the viewport, exactly where the portal puts its save confirmations.
 */
export default function PublicChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/expert")) return null;
  return <>{children}</>;
}
