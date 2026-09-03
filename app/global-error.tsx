"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Last-resort boundary: this one replaces the root layout, so it ships its own
 * html/body and can't rely on fonts, Tailwind layers, or any global chrome
 * having loaded. Inline styles only, on purpose.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7F4EE",
          color: "#1F2D28",
          fontFamily: "Georgia, serif",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "30rem" }}>
          <p style={{ color: "#1A5A4D", letterSpacing: "0.18em", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 600 }}>
            Emoraa
          </p>
          <h1 style={{ fontSize: "2rem", color: "#0A2E28", margin: "1rem 0 0", lineHeight: 1.15 }}>
            Something broke badly enough to take the page with it.
          </h1>
          <p style={{ lineHeight: 1.7, color: "#3a4a44", marginTop: "1rem" }}>
            Nothing you&apos;ve booked or paid for is affected. Please reload — and if it keeps
            happening, email hello@emoraa.in.
          </p>
          <p style={{ lineHeight: 1.7, color: "#3a4a44", marginTop: "1rem" }}>
            If you need someone right now, call{" "}
            <a href="tel:14416" style={{ color: "#0E3B33", fontWeight: 700 }}>
              Tele-MANAS 14416
            </a>{" "}
            — free, confidential, 24x7.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "2rem",
              background: "#0E3B33",
              color: "#F7F4EE",
              border: "none",
              borderRadius: "999px",
              padding: "0.9rem 1.9rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload the page
          </button>
          {error.digest && (
            <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "#7a857f" }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
