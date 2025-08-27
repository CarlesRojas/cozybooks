self.addEventListener("install", (event) => {
    console.log("[SW] Installing Service Worker...");
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("[SW] Activating Service Worker...");
    return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        }),
    );
});
