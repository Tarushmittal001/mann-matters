"use client";

import { useEffect } from "react";

/**
 * Sets <html lang> for the pages of one language, and puts it back on the way
 * out so a Hindi page left behind doesn't leave the English ones announcing
 * themselves as Hindi.
 */
export default function HtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = previous || "en";
    };
  }, [lang]);

  return null;
}
