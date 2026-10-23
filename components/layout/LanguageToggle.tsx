"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LANGUAGE_NAME,
  SWITCH_LABEL,
  hasHindi,
  localeFromPath,
  localePath,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The language button.
 *
 * It is a link, not a setting: it points at the same page in the other
 * language, so the browser's back button works and the URL can be shared. It
 * only appears where the other language actually has that page — offering a
 * switch that lands on English anyway is worse than offering nothing.
 *
 * `hrefLang` is on it so search engines pair the two pages rather than reading
 * the Hindi one as a duplicate.
 */
export default function LanguageToggle({ className }: { className?: string }) {
  const pathname = usePathname() || "/";
  if (!hasHindi(pathname)) return null;

  const current = localeFromPath(pathname);
  const other = current === "hi" ? "en" : "hi";

  return (
    <Link
      href={localePath(other, pathname)}
      hrefLang={other}
      lang={other}
      aria-label={`${LANGUAGE_NAME[other]} — switch language`}
      title={LANGUAGE_NAME[other]}
      className={cn(
        "press shrink-0 rounded-full border border-forest-800/20 px-3 py-1.5 text-small font-semibold text-forest-800 transition-colors hover:border-forest-800 hover:bg-forest-800 hover:text-ivory",
        className
      )}
    >
      {SWITCH_LABEL[current]}
    </Link>
  );
}
