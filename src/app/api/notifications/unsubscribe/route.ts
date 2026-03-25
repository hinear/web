import {
  apiError,
  apiInvalidJson,
  apiSuccess,
  apiUnauthorized,
} from "@/app/api/_lib/response";
import { SupabasePushSubscriptionsRepository } from "@/features/notifications/repositories/supabase-push-subscriptions-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

interface UnsubscribePayload {
  endpoint?: string;
}

export async function DELETE(request: Request) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return apiUnauthorized();
  }

  let payload: UnsubscribePayload;

  try {
    payload = (await request.json()) as UnsubscribePayload;
  } catch {
    return apiInvalidJson();
  }

  if (!payload.endpoint) {
    return apiError("endpoint is required", 400);
  }

  const supabase = await createRequestSupabaseServerClient();
  const repository = new SupabasePushSubscriptionsRepository(supabase);
  const success = await repository.unsubscribe(actorId, payload.endpoint);

  if (!success) {
    return apiError("Failed to unsubscribe", 500);
  }

  return apiSuccess({});
}
