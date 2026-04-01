import { redirect } from "next/navigation";

import { buildAuthPath } from "@/features/auth/lib/next-path";
import {
  buildMcpAuthorizationCode,
  isAllowedRedirectUri,
  isValidRegisteredClient,
} from "@/features/mcp/lib/oauth";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function errorRedirect(
  redirectUri: string,
  error: string,
  state: string | null | undefined
) {
  const url = new URL(redirectUri);
  url.searchParams.set("error", error);
  if (state) {
    url.searchParams.set("state", state);
  }
  return redirect(url.toString());
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const responseType = url.searchParams.get("response_type");
  const clientId = url.searchParams.get("client_id");
  const redirectUri = url.searchParams.get("redirect_uri");
  const codeChallenge = url.searchParams.get("code_challenge");
  const codeChallengeMethod = url.searchParams.get("code_challenge_method");
  const scope = url.searchParams.get("scope") ?? undefined;
  const state = url.searchParams.get("state");
  const resource = url.searchParams.get("resource") ?? undefined;

  if (
    responseType !== "code" ||
    !clientId ||
    !redirectUri ||
    !codeChallenge ||
    codeChallengeMethod !== "S256" ||
    !isAllowedRedirectUri(redirectUri) ||
    !isValidRegisteredClient(clientId, redirectUri)
  ) {
    if (redirectUri && isAllowedRedirectUri(redirectUri)) {
      return errorRedirect(redirectUri, "invalid_request", state);
    }

    return Response.json(
      {
        error: "invalid_request",
      },
      { status: 400 }
    );
  }

  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    const nextPath = `${url.pathname}${url.search}`;
    redirect(buildAuthPath(nextPath));
  }

  const code = buildMcpAuthorizationCode({
    clientId,
    codeChallenge,
    redirectUri,
    resource,
    scope,
    userId: actorId,
  });

  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set("code", code);

  if (state) {
    callbackUrl.searchParams.set("state", state);
  }

  redirect(callbackUrl.toString());
}
