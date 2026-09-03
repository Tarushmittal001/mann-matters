/** @type {import('next').NextConfig} */

import { withSentryConfig } from "@sentry/nextjs/config";

/**
 * Headers applied to every response. This is a site where a logged-in page
 * lists someone's therapy sessions, so the defaults matter more than usual:
 * don't let another site frame us, don't leak the path we came from to a
 * third-party image host, and don't let the browser sniff a content type.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // a URL like /dashboard/profile shouldn't travel to unsplash.com in a Referer
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()",
  },
  // only meaningful over HTTPS; ignored on localhost
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // don't advertise the framework version
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // belt and braces: the route handlers already send no-store, but a
        // misconfigured proxy in front of us shouldn't get a second chance
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          ...securityHeaders,
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: { treeshake: { removeDebugLogging: true } },
});
