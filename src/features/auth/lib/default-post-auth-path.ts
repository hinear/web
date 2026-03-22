import "server-only";

import { getProjectDashboardPath } from "@/features/projects/lib/paths";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

const FALLBACK_POST_AUTH_PATH = "/projects/new";
const DEFAULT_DASHBOARD_PATH = "/projects/dashboard";

export async function getResolvedProjectDashboardPath(): Promise<string> {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return FALLBACK_POST_AUTH_PATH;
  }

  const supabase = await createRequestSupabaseServerClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", actorId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data?.project_id) {
    return FALLBACK_POST_AUTH_PATH;
  }

  return getProjectDashboardPath(data.project_id);
}

export async function getDefaultPostAuthPath(): Promise<string> {
  const resolvedPath = await getResolvedProjectDashboardPath();

  if (resolvedPath === FALLBACK_POST_AUTH_PATH) {
    return resolvedPath;
  }

  return DEFAULT_DASHBOARD_PATH;
}
