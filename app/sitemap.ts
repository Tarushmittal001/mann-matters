import type { MetadataRoute } from "next";
import { listPublished } from "@/lib/blog";
import { listExperts } from "@/lib/experts-store";
import { services } from "@/lib/services";
import { site } from "@/lib/site";
import { toolLinks } from "@/lib/site";

/**
 * Public pages only.
 *
 * Nothing behind a sign-in appears here — a dashboard, a receipt or an intake
 * form has no business in an index, and `robots.ts` disallows those paths as
 * well. Belt and braces, because a sitemap is a much louder invitation than an
 * ordinary link.
 *
 * The pages that exist in both languages carry `alternates.languages`, so the
 * Hindi page is read as the same page in another language rather than as a
 * near-duplicate competing with the English one.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listedExperts = await listExperts();
  /** Paths that exist at both `/x` and `/hi/x`. */
  const bilingual = ["", "/services", "/book", "/crisis", "/signup", "/login"];

  const englishOnly = [
    "/for-organisations",
    "/blog",
    "/about",
    "/made-in-india",
    "/contact",
    "/therapists",
    "/tools",
    "/tools/grounding",
    "/tools/relax",
    "/tools/sounds",
    "/tools/affirmations",
    "/tools/journal",
    "/tools/bmi",
    "/breathe",
    "/check-in",
    "/match",
    "/privacy",
    "/terms",
    "/refund-policy",
    "/cookies",
    // the seven added with the tool rail; kept in step with the navbar menu
    ...toolLinks.map((t) => t.href),
  ];

  const withAlternates = bilingual.map((path) => ({
    url: `${site.url}${path || "/"}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
    alternates: {
      languages: {
        "en-IN": `${site.url}${path || "/"}`,
        "hi-IN": `${site.url}/hi${path}`,
      },
    },
  }));

  const hindi = bilingual.map((path) => ({
    url: `${site.url}/hi${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 0.9 : 0.7,
    alternates: {
      languages: {
        "en-IN": `${site.url}${path || "/"}`,
        "hi-IN": `${site.url}/hi${path}`,
      },
    },
  }));

  // the tool links overlap with the hand-written list above; one entry each
  const english = Array.from(new Set(englishOnly)).map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  /* One entry per practitioner. Read from the live catalogue rather than a
     list kept here, so a therapist added in admin is in the sitemap without
     anybody remembering to add them. */
  const therapistPages = listedExperts.map((e) => ({
    url: `${site.url}/therapists/${e.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const servicePages = services.map((service) => ({
    url: `${site.url}/services/${service.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const articles = (await listPublished()).map((p) => ({
    url: `${site.url}/blog/${p.slug}`,
    lastModified: p.date,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...withAlternates, ...hindi, ...english, ...therapistPages, ...servicePages, ...articles];
}
