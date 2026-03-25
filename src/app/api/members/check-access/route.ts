import {
  apiError,
  apiForbidden,
  apiInvalidJson,
  apiSuccess,
  apiUnauthorized,
} from "@/app/api/_lib/response";
import { SupabaseProjectMembersRepository } from "@/features/project-members/repositories/SupabaseProjectMembersRepository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

interface CheckAccessPayload {
  permission?: string;
  projectId?: string;
  userId?: string;
}

function isValidPayload(payload: CheckAccessPayload) {
  return Boolean(
    payload.projectId &&
      payload.permission &&
      typeof payload.projectId === "string" &&
      typeof payload.permission === "string"
  );
}

export async function POST(request: Request) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return apiUnauthorized();
  }

  let payload: CheckAccessPayload;

  try {
    payload = (await request.json()) as CheckAccessPayload;
  } catch {
    return apiInvalidJson();
  }

  if (!isValidPayload(payload)) {
    return apiError("projectId and permission are required", 400);
  }

  if (payload.userId && payload.userId !== actorId) {
    return apiForbidden();
  }

  const repository = new SupabaseProjectMembersRepository(
    await createRequestSupabaseServerClient()
  );
  const allowed = await repository.hasProjectPermission(
    payload.projectId,
    actorId,
    payload.permission
  );

  return apiSuccess({ allowed });
}
