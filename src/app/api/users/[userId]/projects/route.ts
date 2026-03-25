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
    userId: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return apiUnauthorized();
  }

  const { userId } = await context.params;

  if (userId !== actorId) {
    return apiForbidden();
  }

  const repository = new SupabaseProjectsRepository(
    await createRequestSupabaseServerClient()
  );
  const projects = await repository.listUserProjects(actorId);

  return apiSuccess({ projects });
}
