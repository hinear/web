import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import webpush from "web-push";
import { SupabaseNotificationPreferencesRepository } from "@/features/notifications/repositories/supabase-notification-preferences-repository";
import { SupabasePushSubscriptionsRepository } from "@/features/notifications/repositories/supabase-push-subscriptions-repository";
import type {
  NotificationData,
  PushSubscription,
} from "@/features/notifications/types";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const NOTIFICATION_PUBLIC_KEY = process.env.NOTIFICATION_PUBLIC_KEY ?? "";

webpush.setVapidDetails(
  "mailto:notifications@hinear.local",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

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

/**
 * 알림 설정에 따라 구독을 필터링합니다
 */
async function filterSubscriptionsByPreferences(
  subscriptions: PushSubscription[],
  userIds: string[],
  notificationType: NotificationData["type"],
  preferencesRepo: SupabaseNotificationPreferencesRepository
): Promise<PushSubscription[]> {
  const filtered: PushSubscription[] = [];

  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    const subscription = subscriptions[i];

    if (!subscription) continue;

    // 사용자 알림 설정 조회
    const preferences = await preferencesRepo.getPreferences(userId);

    // 설정이 없으면 기본적으로 모두 알림 허용
    if (!preferences) {
      filtered.push(subscription);
      continue;
    }

    // 알림 타입별로 설정 확인
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
      filtered.push(subscription);
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

/**
 * 알림 전송 (서버 사이드용)
 */
async function sendNotification(data: NotificationData): Promise<void> {
  try {
    const payload = createNotificationPayload(data);
    const targetUserIds = extractTargetUserIds(data);

    if (targetUserIds.length === 0) {
      return;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
    );

    const subscriptionRepo = new SupabasePushSubscriptionsRepository(supabase);
    const subscriptions =
      await subscriptionRepo.getActiveSubscriptions(targetUserIds);

    const preferencesRepo = new SupabaseNotificationPreferencesRepository(
      supabase
    );

    const filteredSubscriptions = await filterSubscriptionsByPreferences(
      subscriptions,
      targetUserIds,
      data.type,
      preferencesRepo
    );

    for (const subscription of filteredSubscriptions) {
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload), {
          vapidDetails: {
            subject: "mailto:notifications@hinear.local",
            publicKey: NOTIFICATION_PUBLIC_KEY,
            privateKey: VAPID_PRIVATE_KEY,
          },
          TTL: 3600,
        });
      } catch (error) {
        console.error("Failed to send notification:", error);
      }
    }

    if (data.issueId) {
      revalidatePath(`/projects/${data.projectId}/issues/${data.issueId}`);
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

/**
 * 이슈 할당 알림 전송
 */
export async function triggerIssueAssignedNotification(data: {
  issueId: string;
  issueIdentifier: string;
  projectId: string;
  actor: { id: string; name: string };
}): Promise<void> {
  const notificationData: NotificationData = {
    type: "issue_assigned",
    issueId: data.issueId,
    issueIdentifier: data.issueIdentifier,
    projectId: data.projectId,
    actor: data.actor,
  };

  await sendNotification(notificationData);
}

/**
 * 이슈 상태 변경 알림 전송
 */
export async function triggerIssueStatusChangedNotification(data: {
  issueId: string;
  issueIdentifier: string;
  projectId: string;
  previousStatus: string;
  newStatus: string;
  actor?: { id: string; name: string };
}): Promise<void> {
  const notificationData: NotificationData = {
    type: "issue_status_changed",
    issueId: data.issueId,
    issueIdentifier: data.issueIdentifier,
    projectId: data.projectId,
    actor: data.actor,
    data: {
      previousStatus: data.previousStatus,
      newStatus: data.newStatus,
    },
  };

  await sendNotification(notificationData);
}

/**
 * 댓글 추가 알림 전송
 */
export async function triggerCommentAddedNotification(data: {
  issueId: string;
  issueIdentifier: string;
  projectId: string;
  commentId: string;
  commentAuthor: string;
  commentPreview: string;
  actor: { id: string; name: string };
}): Promise<void> {
  const notificationData: NotificationData = {
    type: "comment_added",
    issueId: data.issueId,
    issueIdentifier: data.issueIdentifier,
    projectId: data.projectId,
    actor: data.actor,
    data: {
      commentId: data.commentId,
      commentAuthor: data.commentAuthor,
      commentPreview: data.commentPreview,
    },
  };

  await sendNotification(notificationData);
}

/**
 * 프로젝트 초대 알림 전송
 */
export async function triggerProjectInvitedNotification(data: {
  projectId: string;
  projectName: string;
  invitedBy: string;
  role: "owner" | "member";
}): Promise<void> {
  const notificationData: NotificationData = {
    type: "project_invited",
    projectId: data.projectId,
    projectName: data.projectName,
    data: {
      invitedBy: data.invitedBy,
      role: data.role,
    },
  };

  await sendNotification(notificationData);
}
