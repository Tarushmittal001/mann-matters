"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * The client-facing furniture — navbar, footer, newsletter, WhatsApp bubble,
 * chat assistant, safety banner — belongs on the pages clients read. Inside
 * the expert portal it is noise, and worse: three of those float over the
 * bottom of the viewport, exactly where the portal puts its save
 * confirmations.
 *
 * The admin portal is the same case. Nobody reading the payout table needs to
 * be told we are not a substitute for emergency psychiatric care, and the
 * notice lands squarely on the numbers.
 *
 * The navbar is wrapped in this too. Offering a practitioner "Book a session"
 * is offering them the thing they are at work to provide, and stacking a
 * marketing header above a workspace header is two navigations where one is
 * wanted. Staff get StaffBar instead, rendered by each portal's own layout.
 *
 * A signed-in CLIENT is not staff and keeps all of it: /dashboard is a place
 * to go back to precisely because the tools, the blog and the crisis line are
 * one click away from it.
 */
export default function PublicChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/expert") || pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}
