// PWA 자동 업데이트 설정
self.addEventListener("install", (_event) => {
  // 새 서비스 워커가 설치되면 즉시 활성화
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // 활성화되면 즉시 모든 클라이언트를 제어
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
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

  const options = {
    body: notificationData.body || "",
    icon: notificationData.icon || "/icon.png",
    badge: "/icon.png",
    tag: notificationData.tag,
    data: notificationData.data,
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
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
