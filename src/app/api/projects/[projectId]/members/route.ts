import {
  apiForbidden,
  apiSuccess,
  apiUnauthorized,
} from "@/app/api/_lib/response";
import { SupabaseProjectsRepository } from "@/features/projects/repositories/supabase-projects-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

interface RouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return apiUnauthorized();
  }

  const { projectId } = await context.params;
  const repository = new SupabaseProjectsRepository(
    await createRequestSupabaseServerClient()
  );
  const hasAccess = await repository.checkProjectAccess(projectId, actorId);

  if (!hasAccess) {
    return apiForbidden();
  }

  const members = await repository.listProjectMembers(projectId);

  return apiSuccess({ members });
}
