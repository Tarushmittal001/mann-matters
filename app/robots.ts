import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Every one of these paths already sets `robots: { index: false }` in its own
 * metadata, which is what actually keeps them out of an index. This is the
 * cheaper, louder signal on top: a crawler that never fetches the page cannot
 * misread the tag on it, and a receipt or an intake form is not something to
 * be relaxed about twice.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/expert", "/receipt", "/api/", "/verify", "/reset-password"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
