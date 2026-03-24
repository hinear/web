"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { NotificationData, PushSubscription } from "../types";

/**
 * 푸시 알림 구독 mutation
 */
export function useSubscribeToPush() {
  return useMutation({
    mutationFn: async (subscription: PushSubscription) => {
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error("Failed to subscribe to push notifications");
      }

      return response.json();
    },
  });
}

/**
 * 알림 전송 mutation
 */
export function useSendNotification() {
  return useMutation({
    mutationFn: async (data: NotificationData) => {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      return response.json();
    },
  });
}
