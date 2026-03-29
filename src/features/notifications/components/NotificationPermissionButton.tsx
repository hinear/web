"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type PermissionUiState =
  | "default"
  | "granted"
  | "denied"
  | "unsupported-service-worker"
  | "unsupported-notification";

export function NotificationPermissionButton() {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  function getUiState(): PermissionUiState {
    if (!("Notification" in window)) {
      return "unsupported-notification";
    }

    if (!("serviceWorker" in navigator)) {
      return "unsupported-service-worker";
    }

    return permission;
  }

  const uiState = getUiState();

  function updateStatus(message: string, tone: "info" | "success" | "error") {
    setStatusMessage(message);
    if (tone === "success") {
      toast.success(message);
      return;
    }
    if (tone === "error") {
      toast.error(message);
      return;
    }
    toast(message);
  }

  const requestPermission = async () => {
    if (uiState === "unsupported-notification") {
      updateStatus(
        "This device does not support browser notifications.",
        "info"
      );
      return;
    }

    if (uiState === "unsupported-service-worker") {
      updateStatus(
        "This device does not support Service Workers for notifications.",
        "info"
      );
      return;
    }

    if (uiState === "denied") {
      updateStatus(
        "Enable notifications again from your browser or device settings.",
        "info"
      );
      return;
    }

    if (uiState === "granted") {
      updateStatus("Notifications are enabled on this device.", "success");
      return;
    }

    setIsLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        try {
          const registration = await navigator.serviceWorker.ready;
          console.log("[Notification] Service Worker ready:", registration);
          await subscribeToPush(registration);
          updateStatus("Notifications are enabled on this device.", "success");
        } catch (swError) {
          console.error("[Notification] Service Worker not ready:", swError);
          updateStatus(
            "We couldn't finish the notification setup. Try again in a moment.",
            "error"
          );
        }
      } else if (result === "denied") {
        updateStatus(
          "Enable notifications again from your browser or device settings.",
          "info"
        );
      } else {
        updateStatus(
          "Notification permission was dismissed. You can try again at any time.",
          "info"
        );
      }
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      updateStatus("Failed to request notification permission.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const buttonLabel =
    uiState === "unsupported-notification" ||
    uiState === "unsupported-service-worker"
      ? "Notifications unavailable"
      : uiState === "denied"
        ? "Notifications blocked"
        : uiState === "granted"
          ? "Notifications enabled"
          : isLoading
            ? "Requesting..."
            : "Enable notifications";

  const helperMessage =
    statusMessage ??
    (uiState === "denied"
      ? "Enable notifications again from your browser or device settings."
      : uiState === "granted"
        ? "Notifications are enabled on this device."
        : null);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--app-color-border-soft)] bg-[var(--app-color-surface-100)] p-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--app-color-ink-900)]">
            Push Notifications
          </p>
          <p className="text-xs text-[var(--app-color-gray-500)]">
            Get real-time updates about changes to your issues
          </p>
        </div>
        <button
          type="button"
          onClick={requestPermission}
          disabled={isLoading}
          className={`
            app-mobile-touch-target rounded-lg px-4 py-2 text-sm font-semibold
            ${
              uiState === "granted"
                ? "bg-[var(--app-color-gray-100)] text-[var(--app-color-gray-700)]"
                : uiState === "denied" ||
                    uiState === "unsupported-notification" ||
                    uiState === "unsupported-service-worker"
                  ? "bg-[var(--app-color-gray-100)] text-[var(--app-color-gray-700)]"
                  : "bg-[var(--app-color-brand-500)] text-[var(--app-color-white)] hover:bg-[var(--app-color-brand-600)]"
            } transition-colors duration-200
          `}
        >
          {buttonLabel}
        </button>
      </div>
      {helperMessage ? (
        <p
          aria-live="polite"
          className="text-xs text-[var(--app-color-gray-600)]"
        >
          {helperMessage}
        </p>
      ) : null}
    </div>
  );
}

async function subscribeToPush(registration: ServiceWorkerRegistration) {
  try {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
    if (!vapidPublicKey) {
      throw new Error("VAPID public key is not configured");
    }
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });

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
