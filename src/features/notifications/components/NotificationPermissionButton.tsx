"use client";

import { useEffect, useState } from "react";

export function NotificationPermissionButton() {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications.");
      return;
    }

    if (!("serviceWorker" in navigator)) {
      alert("This browser does not support Service Workers.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        // Service Worker 등록 대기 후 푸시 구독
        try {
          const registration = await navigator.serviceWorker.ready;
          console.log("[Notification] Service Worker ready:", registration);
          await subscribeToPush(registration);
        } catch (swError) {
          console.error("[Notification] Service Worker not ready:", swError);
          alert("Failed to initialize the Service Worker.");
        }
      }
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      alert("Failed to request notification permission.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--app-color-border-soft)] bg-[var(--app-color-surface-100)] p-3">
      <div className="flex-1">
        <p className="text-sm font-semibold text-[var(--app-color-ink-900)]">
          Notification Settings
        </p>
        <p className="text-xs text-[var(--app-color-gray-500)]">
          Get real-time updates about changes to your issues
        </p>
      </div>
      <button
        type="button"
        onClick={requestPermission}
        disabled={isLoading || permission === "granted"}
        className={`
          rounded-lg px-4 py-2 text-sm font-semibold
          ${
            permission === "granted"
              ? "bg-[var(--app-color-gray-100)] text-[var(--app-color-gray-400)] cursor-not-allowed"
              : "bg-[var(--app-color-brand-500)] text-[var(--app-color-white)] hover:bg-[var(--app-color-brand-600)]"
          } transition-colors duration-200
        `}
      >
        {permission === "granted"
          ? "Notifications Enabled"
          : isLoading
            ? "Requesting..."
            : "Enable Notifications"}
      </button>
    </div>
  );
}

async function subscribeToPush(registration: ServiceWorkerRegistration) {
  try {
    // VAPID public key를 환경 변수에서 가져오기
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
    if (!vapidPublicKey) {
      throw new Error("VAPID public key is not configured");
    }
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });

    // 구독 정보를 서버에 전송
    await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });

    console.log("Push notification subscribed:", subscription);
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
    throw error;
  }
}

// Base64 URL-safe를 Uint8Array로 변환
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
