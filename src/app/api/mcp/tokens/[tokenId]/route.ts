import { apiError, apiSuccess, apiUnauthorized } from "@/app/api/_lib/response";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

interface RouteContext {
  params: Promise<{
    tokenId: string;
  }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return apiUnauthorized();
  }

  const { tokenId } = await context.params;

  if (!tokenId?.trim()) {
    return apiError("Token ID is required", 400);
  }

  const supabase = await createRequestSupabaseServerClient();
  const { data, error } = await supabase
    .from("mcp_access_tokens")
    .update({
      revoked_at: new Date().toISOString(),
    })
    .eq("id", tokenId)
    .eq("user_id", actorId)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return apiError("Failed to revoke MCP token", 500);
  }

  if (!data) {
    return apiError("MCP token not found", 404);
  }

  return apiSuccess({ tokenId });
}
