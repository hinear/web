import {
  isValidRegisteredClient,
  readMcpAuthorizationCode,
  verifyPkceChallenge,
} from "@/features/mcp/lib/oauth";
import {
  generateMcpAccessToken,
  hashMcpAccessToken,
} from "@/features/mcp/lib/token-utils";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function oauthError(error: string, errorDescription: string, status = 400) {
  return Response.json(
    {
      error,
      error_description: errorDescription,
    },
    { status }
  );
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const grantType = String(formData.get("grant_type") ?? "");
  const code = String(formData.get("code") ?? "");
  const codeVerifier = String(formData.get("code_verifier") ?? "");
  const clientId = String(formData.get("client_id") ?? "");
  const redirectUri = String(formData.get("redirect_uri") ?? "");

  if (grantType !== "authorization_code") {
    return oauthError(
      "unsupported_grant_type",
      "Only authorization_code is supported."
    );
  }

  if (
    !clientId ||
    !redirectUri ||
    !isValidRegisteredClient(clientId, redirectUri)
  ) {
    return oauthError("invalid_client", "Unknown or invalid client.");
  }

  const payload = readMcpAuthorizationCode(code);

  if (!payload) {
    return oauthError(
      "invalid_grant",
      "Invalid or expired authorization code."
    );
  }

  if (payload.clientId !== clientId || payload.redirectUri !== redirectUri) {
    return oauthError(
      "invalid_grant",
      "Authorization code does not match this client."
    );
  }

  if (!(await verifyPkceChallenge(codeVerifier, payload.codeChallenge))) {
    return oauthError("invalid_grant", "PKCE verification failed.");
  }

  const token = generateMcpAccessToken();
  const tokenHash = hashMcpAccessToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("mcp_access_tokens").insert({
    expires_at: expiresAt,
    name: `OAuth ${payload.clientId}`,
    token_hash: tokenHash,
    user_id: payload.userId,
  });

  if (error) {
    return oauthError("server_error", "Failed to mint access token.", 500);
  }

  return Response.json({
    access_token: token,
    expires_in: 3600,
    scope: payload.scope ?? "mcp:tools",
    token_type: "bearer",
  });
}
