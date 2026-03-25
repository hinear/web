"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { SupabasePushSubscriptionsRepository } from "@/features/notifications/repositories/supabase-push-subscriptions-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

export async function unsubscribeFromNotificationsAction(endpoint: string) {
  const userId = await getAuthenticatedActorIdOrNull();

  if (!userId) {
    redirect("/auth/signin");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );

  const subscriptionsRepo = new SupabasePushSubscriptionsRepository(supabase);

  const success = await subscriptionsRepo.unsubscribe(userId, endpoint);

  if (!success) {
    return {
      success: false,
      error: "Failed to unsubscribe from notifications",
    };
  }

  return {
    success: true,
  };
}
