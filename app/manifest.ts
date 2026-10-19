import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * The installable app.
 *
 * Installing matters here for one reason more than convenience: a therapy site
 * in the browser leaves a trail in history and in the tab strip, and an icon
 * on a home screen called "Emoraa" is quieter than a search for "therapy
 * India" is. The shortcuts are the two things somebody opens in a hurry.
 *
 * `display: standalone` rather than fullscreen — losing the status bar on a
 * phone somebody is using at 2 a.m. would take the clock and the battery with
 * it.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.tagline}`,
    short_name: site.name,
    description:
      "Confidential online therapy with certified Indian psychologists, plus free tools with a free account.",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F7F4EE",
    theme_color: "#14312A",
    lang: "en-IN",
    dir: "ltr",
    categories: ["health", "medical", "lifestyle"],
    icons: [
      { src: "/app/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/app/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Crisis help",
        short_name: "Crisis",
        description: "Verified Indian helplines, reachable in one tap",
        url: "/crisis",
      },
      {
        name: "Breathe",
        short_name: "Breathe",
        description: "A paced breath you can follow with your eyes shut",
        url: "/breathe",
      },
      {
        name: "Book a session",
        short_name: "Book",
        description: "Find a therapist and a time",
        url: "/book",
      },
    ],
  };
}
