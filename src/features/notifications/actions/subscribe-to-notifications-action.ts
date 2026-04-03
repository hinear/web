"use server";

import { redirect } from "next/navigation";
import { SupabasePushSubscriptionsRepository } from "@/features/notifications/repositories/supabase-push-subscriptions-repository";
import type { PushSubscription } from "@/features/notifications/types";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function subscribeToNotificationsAction(
  subscription: PushSubscription
) {
  const userId = await getAuthenticatedActorIdOrNull();

  if (!userId) {
    redirect("/auth/signin");
  }

  const supabase = await createRequestSupabaseServerClient();

  const subscriptionsRepo = new SupabasePushSubscriptionsRepository(supabase);

  const result = await subscriptionsRepo.subscribe(userId, subscription);

  if (!result) {
    return {
      success: false,
      error: "Failed to subscribe to notifications",
    };
  }

  return {
    success: true,
    subscription: result,
  };
}
