"use server";

import { redirect } from "next/navigation";
import { SupabaseNotificationPreferencesRepository } from "@/features/notifications/repositories/supabase-notification-preferences-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

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

  const supabase = await createRequestSupabaseServerClient();

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
