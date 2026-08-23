"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * A single glyph at rest. On hover the disc fills, the arrow steps left, and
 * the label surfaces underneath — the label is absolutely positioned so nothing
 * beside it ever moves.
 *
 * If there is somewhere to go back to it goes there; if someone landed here
 * straight from a search result or a shared link, back would leave the site, so
 * it goes home instead.
 */
export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    setHasHistory(window.history.length > 1);
  }, [pathname]);

  if (pathname === "/") return null;

  const label = hasHistory ? "Back" : "Home";

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => (hasHistory ? router.back() : router.push("/"))}
        aria-label={hasHistory ? "Go back" : "Go to the home page"}
        className="peer group grid h-9 w-9 place-items-center rounded-full text-forest-800/70 ring-1 ring-inset ring-forest-800/15 transition-all duration-300 ease-silk hover:bg-forest-800 hover:text-ivory hover:ring-forest-800 focus-visible:bg-forest-800 focus-visible:text-ivory active:scale-90"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          className="transition-transform duration-300 ease-silk group-hover:-translate-x-[2px]"
          aria-hidden="true"
        >
          <path d="M11.5 4.5 6 10l5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <span
        className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-full bg-forest-900 px-2.5 py-1 text-[0.68rem] font-medium tracking-wide text-ivory opacity-0 transition-all duration-300 ease-silk peer-hover:translate-y-0 peer-hover:opacity-100 peer-focus-visible:translate-y-0 peer-focus-visible:opacity-100"
        aria-hidden="true"
      >
        {label}
      </span>
    </div>
  );
}
