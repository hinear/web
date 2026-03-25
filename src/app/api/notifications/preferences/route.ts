import {
  apiError,
  apiInvalidJson,
  apiSuccess,
  apiUnauthorized,
} from "@/app/api/_lib/response";
import { SupabaseNotificationPreferencesRepository } from "@/features/notifications/repositories/supabase-notification-preferences-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

interface UpdateNotificationPreferencesPayload {
  comment_added?: boolean;
  issue_assigned?: boolean;
  issue_status_changed?: boolean;
  project_invited?: boolean;
}

function isValidPreferencesPayload(
  value: unknown
): value is UpdateNotificationPreferencesPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  const allowedKeys = [
    "issue_assigned",
    "issue_status_changed",
    "comment_added",
    "project_invited",
  ];

  return Object.entries(payload).every(
    ([key, entryValue]) =>
      allowedKeys.includes(key) && typeof entryValue === "boolean"
  );
}

export async function GET() {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return apiUnauthorized();
  }

  const supabase = await createRequestSupabaseServerClient();
  const repository = new SupabaseNotificationPreferencesRepository(supabase);
  const preferences = await repository.getPreferences(actorId);

  if (!preferences) {
    return apiError("Failed to load notification preferences", 500);
  }

  return apiSuccess({ preferences });
}

export async function PATCH(request: Request) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return apiUnauthorized();
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return apiInvalidJson();
  }

  if (!isValidPreferencesPayload(payload)) {
    return apiError("Invalid notification preferences payload", 400);
  }

  const supabase = await createRequestSupabaseServerClient();
  const repository = new SupabaseNotificationPreferencesRepository(supabase);

  await repository.getPreferences(actorId);
  const preferences = await repository.updatePreferences(actorId, payload);

  if (!preferences) {
    return apiError("Failed to update notification preferences", 500);
  }

  return apiSuccess({ preferences });
}
