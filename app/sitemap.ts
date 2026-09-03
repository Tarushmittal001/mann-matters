import type { MetadataRoute } from "next";
import { posts } from "@/lib/posts";
import { services } from "@/lib/services";
import { site } from "@/lib/site";
import { therapyPages } from "@/lib/therapy-pages";

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

  const servicePages = services.map((service) => ({
    url: `${site.url}/services/${service.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const discoveryPages = therapyPages.map((page) => ({
    url: `${site.url}/therapy/${page.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...routes, ...servicePages, ...discoveryPages, ...articles];
}
