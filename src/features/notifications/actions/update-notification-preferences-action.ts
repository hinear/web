"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { SupabaseNotificationPreferencesRepository } from "@/features/notifications/repositories/supabase-notification-preferences-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

export async function updateNotificationPreferencesAction(preferences: {
  issue_assigned?: boolean;
  issue_status_changed?: boolean;
  comment_added?: boolean;
  project_invited?: boolean;
}) {
  const userId = await getAuthenticatedActorIdOrNull();

  if (!userId) {
    redirect("/auth/signin");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );

  const preferencesRepo = new SupabaseNotificationPreferencesRepository(
    supabase
  );

  const result = await preferencesRepo.updatePreferences(userId, preferences);

  if (!result) {
    return {
      success: false,
      error: "Failed to update notification preferences",
    };
  }

  return {
    success: true,
    preferences: result,
  };
}
