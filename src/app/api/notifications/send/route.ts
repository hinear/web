import { revalidatePath } from "next/cache";
import webpush from "web-push";
import { apiError, apiSuccess } from "@/app/api/_lib/response";
import { SupabaseNotificationPreferencesRepository } from "@/features/notifications/repositories/supabase-notification-preferences-repository";
import { SupabasePushSubscriptionsRepository } from "@/features/notifications/repositories/supabase-push-subscriptions-repository";
import type {
  NotificationData,
  UserPushSubscription,
} from "@/features/notifications/types";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server-client";

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ??
  process.env.NOTIFICATION_PUBLIC_KEY ??
  "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";

webpush.setVapidDetails(
  "mailto:notifications@hinear.local",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export async function POST(request: Request) {
  try {
    const notificationData: NotificationData = await request.json();

    // 알림 페이로드 생성
    const payload = createNotificationPayload(notificationData);

    // 대상 사용자 ID 목록 추출
    const targetUserIds = extractTargetUserIds(notificationData);

    if (targetUserIds.length === 0) {
      return apiSuccess({
        success: true,
        sent: 0,
        failed: 0,
        message: "No target users",
      });
    }

    const supabase = createServiceRoleSupabaseClient();

    // Repository로부터 활성 구독 조회
    const subscriptionRepo = new SupabasePushSubscriptionsRepository(supabase);
    const subscriptions =
      await subscriptionRepo.getActiveSubscriptions(targetUserIds);

    // 알림 설정 확인 (선택적 - 여기서는 간단히 모두 전송)
    const preferencesRepo = new SupabaseNotificationPreferencesRepository(
      supabase
    );

    // 필터링된 구독자 목록 (알림 설정 고려)
    const filteredSubscriptions = await filterSubscriptionsByPreferences(
      subscriptions,
      notificationData.type,
      preferencesRepo
    );

    // 알림 전송
    let successCount = 0;
    let failCount = 0;

    for (const { subscription } of filteredSubscriptions) {
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload), {
          vapidDetails: {
            subject: "mailto:notifications@hinear.local",
            publicKey: VAPID_PUBLIC_KEY,
            privateKey: VAPID_PRIVATE_KEY,
          },
          TTL: 3600,
        });
        successCount++;
      } catch (error) {
        console.error("Failed to send notification:", error);
        failCount++;
      }
    }

    // 관련 페이지 캐시 무효화
    if (notificationData.issueId) {
      revalidatePath(
        `/projects/${notificationData.projectId}/issues/${notificationData.issueId}`
      );
    }

    return apiSuccess({
      success: true,
      sent: successCount,
      failed: failCount,
    });
  } catch (error) {
    console.error("Notification error:", error);
    return apiError("Failed to send notification", 500);
  }
}

/**
 * 알림 데이터로부터 대상 사용자 ID 목록을 추출합니다
 */
function extractTargetUserIds(data: NotificationData): string[] {
  if (data.targetUserIds && data.targetUserIds.length > 0) {
    return [...new Set(data.targetUserIds.filter(Boolean))];
  }

  if (data.actor?.id) {
    return [data.actor.id];
  }

  return [];
}

/**
 * 알림 설정에 따라 구독을 필터링합니다
 */
async function filterSubscriptionsByPreferences(
  subscriptions: UserPushSubscription[],
  notificationType: NotificationData["type"],
  preferencesRepo: SupabaseNotificationPreferencesRepository
): Promise<UserPushSubscription[]> {
  const filtered: UserPushSubscription[] = [];

  for (const subscriptionRecord of subscriptions) {
    const preferences = await preferencesRepo.getPreferences(
      subscriptionRecord.userId
    );

    if (!preferences) {
      filtered.push(subscriptionRecord);
      continue;
    }

    let enabled = false;

    switch (notificationType) {
      case "issue_assigned":
        enabled = preferences.issue_assigned ?? true;
        break;
      case "issue_status_changed":
        enabled = preferences.issue_status_changed ?? true;
        break;
      case "comment_added":
        enabled = preferences.comment_added ?? true;
        break;
      case "project_invited":
        enabled = preferences.project_invited ?? true;
        break;
      default:
        enabled = true;
    }

    if (enabled) {
      filtered.push(subscriptionRecord);
    }
  }

  return filtered;
}

function createNotificationPayload(data: NotificationData) {
  const { type, issueIdentifier, actor } = data;

  switch (type) {
    case "issue_assigned":
      return {
        title: "이슈 할당 알림",
        body: `${actor?.name || "사용자"}님이 ${issueIdentifier}를 당신에게 할당했습니다.`,
        icon: "/icon.png",
        tag: `issue-${data.issueId}-assigned`,
        data,
      };

    case "issue_updated":
      return {
        title: "이슈 변경 알림",
        body: `${actor?.name || "사용자"}님이 ${issueIdentifier}를 변경했습니다.`,
        icon: "/icon.png",
        tag: `issue-${data.issueId}-updated`,
        data,
      };

    case "issue_status_changed": {
      const { previousStatus, newStatus } = data.data as {
        previousStatus: string;
        newStatus: string;
      };
      return {
        title: "상태 변경 알림",
        body: `${issueIdentifier}가 '${previousStatus}'에서 '${newStatus}'(으)로 변경되었습니다.`,
        icon: "/icon.png",
        tag: `issue-${data.issueId}-status`,
        data,
      };
    }

    case "comment_added":
      return {
        title: "댓글 알림",
        body: `${actor?.name || "사용자"}님이 ${issueIdentifier}에 댓글을 남겼습니다.`,
        icon: "/icon.png",
        tag: `issue-${data.issueId}-comment`,
        data,
      };

    case "project_invited":
      return {
        title: "프로젝트 초대 알림",
        body: `${data.projectName} 프로젝트에 초대되었습니다.`,
        icon: "/icon.png",
        tag: `project-${data.projectId}-invited`,
        data,
      };

    default:
      return {
        title: "Hinear 알림",
        body: "새로운 알림이 있습니다.",
        icon: "/icon.png",
        data,
      };
  }
}
