"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/auth";

/**
 * Role-based navigation. The portal only ever renders for EXPERT and ADMIN;
 * the extra cross-links below the rule are the ones that depend on the role,
 * so an expert is never shown a door that will bounce them.
 */

export type NavItem = {
  href: string;
  label: string;
  /** Small count shown beside the label, e.g. sessions today. */
  badge?: number;
  hint: string;
};

const ICONS: Record<string, JSX.Element> = {
  "/expert": (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.6V12l3.1 1.9" />
    </>
  ),
  "/expert/sessions": (
    <>
      <rect x="3.6" y="5" width="16.8" height="15.4" rx="3" />
      <path d="M3.6 10h16.8M8.5 3.2v3.6M15.5 3.2v3.6" />
    </>
  ),
  "/expert/availability": (
    <>
      <rect x="3.6" y="4.6" width="16.8" height="15.8" rx="3" />
      <path d="M7.6 9.2h8.8M7.6 13h5.6M7.6 16.6h3.4" />
    </>
  ),
  "/expert/profile": (
    <>
      <circle cx="12" cy="8.4" r="3.6" />
      <path d="M5.2 19.6a6.8 6.8 0 0 1 13.6 0" />
    </>
  ),
  "/expert/notifications": (
    <>
      <path d="M6.4 10.4a5.6 5.6 0 0 1 11.2 0c0 3.4 1.2 4.8 1.8 5.4H4.6c.6-.6 1.8-2 1.8-5.4Z" />
      <path d="M10 18.8a2.1 2.1 0 0 0 4 0" />
    </>
  ),
};

function NavIcon({ href }: { href: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {ICONS[href]}
    </svg>
  );
}

function isActive(pathname: string, href: string) {
  return href === "/expert" ? pathname === "/expert" : pathname.startsWith(href);
}

export default function ExpertNav({ items, role }: { items: NavItem[]; role: Role }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Expert portal" className="lg:sticky lg:top-28">
      {/* mobile: a scrollable rail that keeps the current tab in view */}
      <ul className="rail -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-2 lg:hidden">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-[0.86rem] font-medium transition-colors",
                  active
                    ? "border-forest-700 bg-forest-800 text-ivory"
                    : "border-forest-800/15 bg-ivory-light text-forest-800"
                )}
              >
                <NavIcon href={item.href} />
                {item.label}
                {item.badge ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[0.7rem] font-bold tabular-nums",
                      active ? "bg-ivory/20 text-ivory" : "bg-sage-light/70 text-forest-800"
                    )}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* desktop: a labelled sidebar */}
      <ul className="hidden lg:block lg:space-y-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-start gap-3 rounded-xl px-3.5 py-3 transition-colors duration-200",
                  active
                    ? "bg-forest-800 text-ivory"
                    : "text-forest-900 hover:bg-forest-800/[0.055]"
                )}
              >
                <span className={cn("mt-0.5", active ? "text-ivory" : "text-forest-600")}>
                  <NavIcon href={item.href} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[0.92rem] font-semibold">{item.label}</span>
                    {item.badge ? (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[0.7rem] font-bold tabular-nums",
                          active ? "bg-ivory/20 text-ivory" : "bg-sage-light/70 text-forest-800"
                        )}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block text-[0.78rem] leading-snug",
                      active ? "text-sage-light/80" : "text-ink/55"
                    )}
                  >
                    {item.hint}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 hidden border-t border-forest-800/10 pt-5 lg:block">
        <p className="px-3.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink/40">
          {role === "ADMIN" ? "Also yours" : "Elsewhere"}
        </p>
        <ul className="mt-2 space-y-0.5">
          {role === "ADMIN" && (
            <li>
              <Link
                href="/admin"
                className="block rounded-lg px-3.5 py-2 text-[0.86rem] font-medium text-forest-800 transition-colors hover:bg-forest-800/[0.055]"
              >
                Admin portal
              </Link>
            </li>
          )}
          <li>
            <Link
              href="/crisis"
              className="block rounded-lg px-3.5 py-2 text-[0.86rem] font-medium text-forest-800 transition-colors hover:bg-forest-800/[0.055]"
            >
              Crisis protocol
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
