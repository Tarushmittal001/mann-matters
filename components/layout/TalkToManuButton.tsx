"use client";

import { openManuChat } from "@/lib/manu-chat";

/**
 * "Talk to Manu" — opens the on-site chat, the one Manu (lib/manu-chat.ts).
 *
 * It used to open WhatsApp to the team's number, with a pulsing green dot for
 * "someone is there". Nobody was: the number is answered in working hours, and
 * Manu is an AI that lives in the chat. So the button opens the chat, the dot
 * is gone, and the sub-label says what it is: free, and an AI.
 */
export default function TalkToManuButton({
  className = "",
  label = "Talk to Manu",
  note = "free · an AI, any hour",
}: {
  className?: string;
  label?: string;
  note?: string;
}) {
  return (
    <button
      type="button"
      onClick={openManuChat}
      aria-label={`${label} — ${note.replace(/·/g, ",")}`}
      className={`group inline-flex items-center gap-2.5 rounded-full border border-forest-800/25 bg-ivory-light/70 py-1.5 pl-1.5 pr-5 transition duration-300 ease-silk hover:-translate-y-0.5 hover:border-forest-800 hover:bg-forest-800 hover:shadow-bloom ${className}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-800 text-ivory shadow-lift transition-transform duration-300 ease-silk group-hover:scale-105">
        {/* the same speech bubble as the chat's own launcher */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.4 9 9 0 0 1-3.9-.9L3 21l1.9-4.6A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z" strokeLinejoin="round" />
        </svg>
      </span>

      <span className="flex flex-col text-left leading-tight">
        <span className="text-[0.88rem] font-semibold tracking-wide text-forest-800 transition-colors duration-300 group-hover:text-ivory">
          {label}
        </span>
        <span className="mt-0.5 text-[0.75rem] text-ink/70 transition-colors duration-300 group-hover:text-ivory/70">
          {note}
        </span>
      </span>
    </button>
  );
}
