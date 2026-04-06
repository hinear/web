/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, Serwist } from "serwist";

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    ...defaultCache,
    {
      matcher: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: new CacheFirst({
        cacheName: "static-images",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          }),
        ],
      }),
    },
  ],
});

serwist.addEventListeners();

// Push notification handling
self.addEventListener("push", (event: PushEvent) => {
  let notificationData = {
    title: "Hinear 알림",
    body: "새로운 알림이 있습니다.",
    icon: "/icon.png",
  };

  try {
    if (event.data) {
      notificationData = event.data.json();
    }
  } catch (error) {
    console.error("[Service Worker] Error parsing push data:", error);
  }

  const options: NotificationOptions = {
    body: notificationData.body || "",
    icon: notificationData.icon || "/icon.png",
    tag: notificationData.tag,
    data: notificationData.data,
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const data = event.notification.data;
  let url = "/";

  if (data?.issueId && data?.projectId) {
    url = `/projects/${data.projectId}/issues/${data.issueId}`;
  } else if (data?.projectId) {
    url = `/projects/${data.projectId}`;
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
