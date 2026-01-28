const CACHE_NAME = "cache-verreifieur-v0.8";
const URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/icon-192x192.png",
  // ajoute ici si tu as d'autres ressources statiques à cacher
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((resp) => {
        return resp || fetch(event.request);
      })
  );
});
