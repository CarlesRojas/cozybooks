self.addEventListener("install", (event) => {
    console.log("[SW] Installing Service Worker...");
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("[SW] Activating Service Worker...");
    return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const request = event.request;

    // Never sit in front of the api. Auth calls are POSTs that carry cookies and must
    // reach the server untouched; routing them through here only ever added a
    // "(from service worker)" label to failures that had nothing to do with caching.
    if (request.method !== "GET") return;
    if (new URL(request.url).pathname.startsWith("/api/")) return;

    event.respondWith(
        caches.match(request).then((response) => {
            return response || fetch(request);
        }),
    );
});
