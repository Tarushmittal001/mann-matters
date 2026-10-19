/**
 * Two languages, decided by the URL.
 *
 * `/crisis` is English, `/hi/crisis` is Hindi. No cookie, no negotiation
 * header, no guessing from the browser: a link somebody sends to their mother
 * opens in the language they sent it in, and the page can still be cached,
 * which a cookie-sniffing page cannot.
 *
 * Hindi covers the journey somebody actually walks — the nav, the home page,
 * services, booking, signing up and the crisis page. Blog posts and the long
 * essays stay in English, because a half-translated article reads worse than
 * an honest English one, and translating those properly is a writing job
 * rather than a code one.
 */

export const LOCALES = ["en", "hi"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** The locale a path is in: "/hi/book" → "hi", everything else → "en". */
export function localeFromPath(pathname: string): Locale {
  return pathname === "/hi" || pathname.startsWith("/hi/") ? "hi" : "en";
}

/** "/hi/book" → "/book". The English path is the canonical one everywhere else. */
export function stripLocale(pathname: string): string {
  if (pathname === "/hi") return "/";
  if (pathname.startsWith("/hi/")) return pathname.slice(3);
  return pathname;
}

/** The same page in the other language, when it exists there. */
export function localePath(locale: Locale, path: string): string {
  const bare = stripLocale(path);
  if (locale === "en") return bare;
  return bare === "/" ? "/hi" : `/hi${bare}`;
}

/**
 * Which pages exist in Hindi.
 *
 * The toggle only offers itself where there is something to switch to. Sending
 * somebody to a Hindi URL that falls back to English is worse than not
 * offering the switch at all — it looks broken, and it is.
 */
const HINDI_PAGES = ["/", "/crisis", "/services", "/book", "/signup", "/login"];

export function hasHindi(pathname: string): boolean {
  // An exact list, deliberately. This used to also match /services/<slug>,
  // which put a language button on every service page pointing at a Hindi URL
  // that does not exist — the precise failure this function is here to stop.
  // Add a path here only once the page behind it is actually there.
  return HINDI_PAGES.includes(stripLocale(pathname));
}

export const LANGUAGE_NAME: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
};

/** What the toggle says: the language it would take you to. */
export const SWITCH_LABEL: Record<Locale, string> = {
  en: "हिं",
  hi: "EN",
};
