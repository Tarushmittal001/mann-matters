/*
 * Emoraa's service worker.
 *
 * Its job is narrow on purpose: make the crisis page work when the signal
 * doesn't, and get out of the way otherwise.
 *
 * The free tools used to be precached too. They now require an account, which
 * means their HTML varies by who is asking — and a page that varies by account
 * is exactly what the rule below says never to cache. Worse, the precache runs
 * on install, when nobody is signed in, so it would have stored a sign-in wall
 * and served that offline to a signed-in person. /crisis is ungated and has a
 * breathing exercise built into the page, so the one thing that genuinely must
 * survive a dead signal still does.
 *
 * PAGES ARE CACHED BY ALLOW-LIST, NOT DENY-LIST. v2 cached every page except a
 * list of private prefixes, and the list missed /plan, /prescription, /book,
 * /verify and /reset-password — so a prescription stayed on the phone after
 * sign-out and opened offline for whoever picked it up next. A phone is a
 * shared object in a lot of Indian households, and a cached therapy page that
 * renders after the account is signed out is a disclosure, not a feature. So a
 * page is stored only when it is on PUBLIC_PAGES, has no query string (tokens
 * and filters live there), and the server did not mark it private or no-store.
 * A new private route is safe by default; a new public one just isn't offline.
 *
 * WHAT IT WILL NEVER TOUCH: /dashboard, /admin, /expert, /receipt, /api and
 * the other PRIVATE prefixes always go to the network and are never read from
 * or written to a cache.
 *
 * On sign-out the page posts { type: "signed-out" } and every page and image
 * is dropped; only the precache and the hashed build output stay.
 *
 * Bump CACHE when this file changes; the old one is deleted on activate.
 */

const CACHE = "emoraa-v3"; // v3: pages by allow-list; drops v2, which could hold private pages

/* Worth having before the signal goes. The crisis page is first for a reason. */
const PRECACHE = [
  "/offline",
  "/crisis",
  "/tools",
  "/app/icon-192.png",
];

/** Anything under these never touches a cache, read or write. */
const PRIVATE = [
  "/dashboard",
  "/admin",
  "/expert",
  "/receipt",
  "/plan",
  "/prescription",
  "/book",
  "/hi/book",
  "/api/",
  "/login",
  "/signup",
  "/hi/login",
  "/hi/signup",
  "/verify",
  "/forgot-password",
  "/reset-password",
  // the tools now render per account: a wall or the tool itself
  "/tools/",
  "/breathe",
  "/check-in",
  "/match",
];

/** The only pages that may be kept for offline reading: the same for everyone. */
const PUBLIC_PAGES = new Set([
  "/",
  "/about",
  "/blog",
  "/services",
  "/therapists",
  "/contact",
  "/for-organisations",
  "/join",
  "/made-in-india",
  "/privacy",
  "/terms",
  "/cookies",
  "/refund-policy",
  "/crisis",
  "/tools",
  "/offline",
  "/hi",
  "/hi/services",
  "/hi/crisis",
]);
const PUBLIC_PREFIXES = ["/blog/", "/services/", "/therapists/"];

const isPrivate = (url) => PRIVATE.some((p) => url.pathname.startsWith(p));

const isPublicPage = (url) =>
  url.search === "" &&
  !isPrivate(url) &&
  (PUBLIC_PAGES.has(url.pathname) || PUBLIC_PREFIXES.some((p) => url.pathname.startsWith(p)));

/** The server's word wins: a response it calls private is never stored. */
const storable = (res) =>
  res.ok &&
  res.type === "basic" &&
  !res.redirected &&
  !/no-store|private/i.test(res.headers.get("Cache-Control") || "");

const keep = (request, res) => {
  if (!storable(res)) return;
  const copy = res.clone();
  caches.open(CACHE).then((c) => c.put(request, copy));
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // one missing page must not fail the whole install
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Sign-out: forget every page and image; keep the precache and build output. */
self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "signed-out") return;
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.keys().then((requests) =>
        Promise.all(
          requests
            .filter((req) => {
              const { pathname } = new URL(req.url);
              return !PRECACHE.includes(pathname) && !pathname.startsWith("/_next/static/");
            })
            .map((req) => cache.delete(req))
        )
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Pages: the network has the truth. Only a public page is ever kept as a
  // safety net; anything else offline gets /offline, which leads with the
  // crisis numbers.
  if (request.mode === "navigate") {
    const publicPage = isPublicPage(url);
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (publicPage) keep(request, res);
          return res;
        })
        .catch(() =>
          (publicPage ? caches.match(request) : Promise.resolve(undefined)).then(
            (hit) => hit || caches.match("/offline")
          )
        )
    );
    return;
  }

  if (isPrivate(url)) return; // straight to the network, never stored

  // Next's build output is content-hashed, so it can be served from the cache
  // for as long as it exists without ever going stale.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            keep(request, res);
            return res;
          })
      )
    );
    return;
  }

  // the image optimiser proxies another path; it inherits that path's privacy
  if (url.pathname === "/_next/image") {
    const source = url.searchParams.get("url") || "";
    if (isPrivate(new URL(source, self.location.origin))) return;
  }

  // Images, fonts, sounds: whatever we have, refreshed quietly behind it.
  if (["image", "font", "audio", "style"].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((hit) => {
        const live = fetch(request)
          .then((res) => {
            keep(request, res);
            return res;
          })
          .catch(() => hit);
        return hit || live;
      })
    );
  }
});
