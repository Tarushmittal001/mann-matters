"use client";

import { useState } from "react";
import EmailComposer from "@/components/contact/EmailComposer";
import { site } from "@/lib/site";

/**
 * Our email address, shown as text, that opens the composer when clicked.
 * Styled by the caller, so it fits the contact page and the dark footer alike.
 */
export default function EmailLink({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <a
        href={`mailto:${site.email}`}
        onClick={(e) => {
          // a real mailto: stays underneath for no-JS and "copy link address"
          e.preventDefault();
          setOpen(true);
        }}
        className={className}
        aria-haspopup="dialog"
      >
        {site.email}
      </a>
      <EmailComposer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
