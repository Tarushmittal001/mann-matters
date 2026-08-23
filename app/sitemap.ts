import type { MetadataRoute } from "next";
import { posts } from "@/lib/posts";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/services",
    "/for-organisations",
    "/book",
    "/blog",
    "/about",
    "/contact",
    "/tools",
    "/tools/grounding",
    "/tools/relax",
    "/tools/sounds",
    "/tools/affirmations",
    "/tools/sleep",
    "/tools/journal",
    "/tools/bmi",
    "/breathe",
    "/check-in",
    "/match",
    "/crisis",
  ].map(
    (path) => ({
      url: `${site.url}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    })
  );

  const articles = posts.map((p) => ({
    url: `${site.url}/blog/${p.slug}`,
    lastModified: p.date,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...routes, ...articles];
}
