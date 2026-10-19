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
 * WHAT IT WILL NEVER CACHE, and why:
 *   /dashboard, /admin, /expert, /receipt, /api  — somebody's sessions, their
 *   intake form, their receipt. A phone is a shared object in a lot of Indian
 *   households, and a cached therapy dashboard that renders after the account
 *   is signed out is a disclosure, not a feature. These always go to the
 *   network and are never written to a cache, in either direction.
 *
 * Bump CACHE when this file changes; the old one is deleted on activate.
 */

const CACHE = "emoraa-v2"; // v2: gated tools dropped from the precache

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
  "/api/",
  "/login",
  "/signup",
  // the tools now render per account: a wall or the tool itself
  "/tools/",
  "/breathe",
  "/check-in",
  "/match",
];

const isPrivate = (url) => PRIVATE.some((p) => url.pathname.startsWith(p));

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

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isPrivate(url)) return; // straight to the network, never stored

  // Next's build output is content-hashed, so it can be served from the cache
  // for as long as it exists without ever going stale.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          })
      )
    );
    return;
  }

  // Pages: the network has the truth, the cache is the safety net, and /offline
  // is what's left when neither has anything.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match("/offline")))
    );
    return;
  }

  // Images, fonts, sounds: whatever we have, refreshed quietly behind it.
  if (["image", "font", "audio", "style"].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((hit) => {
        const live = fetch(request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          })
          .catch(() => hit);
        return hit || live;
      })
    );
  }
});
