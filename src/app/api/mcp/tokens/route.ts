import {
  apiError,
  apiInvalidJson,
  apiSuccess,
  apiUnauthorized,
} from "@/app/api/_lib/response";
import {
  generateMcpAccessToken,
  hashMcpAccessToken,
  type McpTokenExpiryOption,
  resolveMcpTokenExpiryDate,
} from "@/features/mcp/lib/token-utils";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

interface CreateMcpTokenPayload {
  expiresInDays?: McpTokenExpiryOption;
  name?: string;
}

function isCreateTokenPayload(value: unknown): value is CreateMcpTokenPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  const expiresInDays = payload.expiresInDays;
  const name = payload.name;

  const validExpiry =
    expiresInDays === undefined ||
    expiresInDays === 30 ||
    expiresInDays === 90 ||
    expiresInDays === "never";

  const validName =
    name === undefined || (typeof name === "string" && name.trim().length > 0);

  return validExpiry && validName;
}

export async function GET() {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return apiUnauthorized();
  }

  const supabase = await createRequestSupabaseServerClient();
  const { data, error } = await supabase
    .from("mcp_access_tokens")
    .select("id,name,created_at,last_used_at,expires_at,revoked_at")
    .order("created_at", { ascending: false });

  if (error) {
    return apiError("Failed to load MCP tokens", 500);
  }

  return apiSuccess({ tokens: data ?? [] });
}

export async function POST(request: Request) {
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

  if (!isCreateTokenPayload(payload)) {
    return apiError("Invalid MCP token payload", 400);
  }

  const name = payload.name?.trim() || "My MCP token";
  const expiresInDays = payload.expiresInDays ?? 30;
  const plainToken = generateMcpAccessToken();
  const tokenHash = hashMcpAccessToken(plainToken);
  const expiresAt = resolveMcpTokenExpiryDate(expiresInDays);

  const supabase = await createRequestSupabaseServerClient();
  const { data, error } = await supabase
    .from("mcp_access_tokens")
    .insert({
      expires_at: expiresAt,
      name,
      token_hash: tokenHash,
      user_id: actorId,
    })
    .select("id,name,created_at,last_used_at,expires_at,revoked_at")
    .single();

  if (error || !data) {
    return apiError("Failed to create MCP token", 500);
  }

  return apiSuccess(
    {
      token: plainToken,
      tokenRecord: data,
    },
    201
  );
}
