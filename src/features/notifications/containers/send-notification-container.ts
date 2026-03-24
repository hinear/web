import "server-only";

import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";
import type { NotificationData } from "../types";

export interface SendNotificationData {
  notificationData: NotificationData;
  targetUserIds: string[];
}

export interface SendNotificationResult {
  data: {
    success: boolean;
    sent: number;
    failed: number;
  } | null;
  error: Error | null;
}

/**
 * Container: 알림 전송 로직
 */
export async function sendNotificationContainer(
  _supabase: AppSupabaseServerClient,
  notificationData: NotificationData
): Promise<SendNotificationResult> {
  try {
    // 대상 사용자 ID 목록 추출
    const targetUserIds = extractTargetUserIds(notificationData);

    if (targetUserIds.length === 0) {
      return {
        data: {
          success: true,
          sent: 0,
          failed: 0,
        },
        error: null,
      };
    }

    return {
      data: {
        success: true,
        sent: 0, // 실제 전송 로직은 라우트에서 처리
        failed: 0,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error("Failed to send notification"),
    };
  }
}

/**
 * 알림 데이터로부터 대상 사용자 ID 목록을 추출합니다
 */
function extractTargetUserIds(data: NotificationData): string[] {
  if (data.actor?.id) {
    return [data.actor.id];
  }

  if (data.type === "project_invited") {
    return [];
  }

  return [];
}
