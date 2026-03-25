import { apiError, apiSuccess, apiUnauthorized } from "@/app/api/_lib/response";
import { SupabasePushSubscriptionsRepository } from "@/features/notifications/repositories/supabase-push-subscriptions-repository";
import type { PushSubscription } from "@/features/notifications/types";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function POST(request: Request) {
  try {
    const supabase = await createRequestSupabaseServerClient();

    // 인증된 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    const subscription: PushSubscription = await request.json();
    const repository = new SupabasePushSubscriptionsRepository(supabase);

    // DB에 구독 정보 저장
    const result = await repository.subscribe(user.id, subscription);

    if (!result) {
      return apiError("Failed to save subscription", 500);
    }

    return apiSuccess({ message: "Subscribed successfully" });
  } catch (error) {
    console.error("Subscription error:", error);
    return apiError("Failed to subscribe", 400);
  }
}
