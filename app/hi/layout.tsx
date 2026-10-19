import type { ReactNode } from "react";
import HtmlLang from "@/components/layout/HtmlLang";

/**
 * Everything under /hi.
 *
 * The <html lang> attribute lives in the root layout and cannot be changed
 * from here without making the whole app dynamic, so a two-line client
 * component sets it on the live document instead. Screen readers read the DOM,
 * not the server's first byte, so they pick up the change and switch voice —
 * which is the entire reason the attribute matters.
 */
export default function HindiLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HtmlLang lang="hi" />
      {/* In the server's HTML too, not only after hydration: a screen reader or
          a search engine reading the first byte gets Hindi for this content.
          The navbar, footer and other shared chrome set their own lang. */}
      <div lang="hi">{children}</div>
    </>
  );
}
