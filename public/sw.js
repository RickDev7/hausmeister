importScripts("/sw-bg-notifications.js");

const CACHE_NAME = "muellplaner-v3";
const STATIC_ASSETS = [
  "/",
  "/calendar",
  "/history",
  "/addresses",
  "/settings",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/sw-bg-notifications.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => undefined))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response.ok && event.request.url.startsWith(self.location.origin)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Planejador de Lixo", body: event.data.text() };
  }

  event.waitUntil(
    (async () => {
      if (payload.kind === "evening_missed" && payload.collectionEventId) {
        const hasCheckIn = await self.hasCheckInForEvent(payload.collectionEventId);
        if (hasCheckIn) return;
      }

      await self.registration.showNotification(payload.title || "Planejador de Lixo", {
        body: payload.body || "",
        tag: payload.tag || "muellplaner-push",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: payload,
      });
    })()
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        client.postMessage({ type: "PUSH_SUBSCRIPTION_EXPIRED" });
      }
    })
  );
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-collections") {
    event.waitUntil(self.runBackgroundNotificationCheck());
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === "check-collections") {
    event.waitUntil(self.runBackgroundNotificationCheck());
  }
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  if (data.type === "SHOW_NOTIFICATION") {
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    });
  }

  if (data.type === "ENABLE_BG_CHECKS" || data.type === "RUN_BG_CHECK") {
    event.waitUntil(self.runBackgroundNotificationCheck());
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow("/");
    })
  );
});
