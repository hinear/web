import "server-only";

import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";
import type { PushSubscription } from "../types";

export interface PushSubscriptionData {
  userId: string;
  subscription: PushSubscription;
}

export interface LoadPushSubscriptionResult {
  data: { success: boolean } | null;
  error: Error | null;
}

/**
 * Container: 푸시 구독 처리 로직
 */
export async function loadPushSubscriptionContainer(
  _supabase: AppSupabaseServerClient,
  userId: string,
  subscription: PushSubscription
): Promise<LoadPushSubscriptionResult> {
  try {
    // Repository 레벨에서 처리해야 할 로직
    // 현재는 라우트에서 직접 처리하므로 컨테이너는 검증만 수행
    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!subscription || !subscription.endpoint) {
      throw new Error("Invalid subscription data");
    }

    return {
      data: { success: true },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error("Failed to process subscription"),
    };
  }
}
