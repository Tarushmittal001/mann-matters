"use client";

import { usePathname } from "next/navigation";
import { localeFromPath, localePath, type Locale } from "@/lib/i18n";
import { copy, type Copy } from "@/lib/i18n/copy";

/**
 * The language a client component is being rendered in, taken from the URL.
 *
 * No provider and no context: the path already says which language this is, so
 * every client component can work it out for itself without anything having to
 * be wrapped, passed down, or kept in sync. A component that ends up in both
 * languages is correct in both by construction.
 */
export function useLocale(): Locale {
  return localeFromPath(usePathname() || "/");
}

/** The locale, the copy, and a link helper that keeps you in your language. */
export function useCopy(): { locale: Locale; t: Copy; path: (p: string) => string } {
  const locale = useLocale();
  return {
    locale,
    t: copy(locale),
    path: (p: string) => localePath(locale, p),
  };
}
