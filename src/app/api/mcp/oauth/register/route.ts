import {
  buildMcpRegisteredClient,
  isAllowedRedirectUri,
} from "@/features/mcp/lib/oauth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function registrationError(
  error: string,
  errorDescription: string,
  status = 400
) {
  return Response.json(
    {
      error,
      error_description: errorDescription,
    },
    { status }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    client_name?: unknown;
    grant_types?: unknown;
    redirect_uris?: unknown;
    response_types?: unknown;
    scope?: unknown;
    token_endpoint_auth_method?: unknown;
  } | null;

  const redirectUris = Array.isArray(body?.redirect_uris)
    ? body.redirect_uris.filter(
        (value): value is string =>
          typeof value === "string" && isAllowedRedirectUri(value)
      )
    : [];

  if (redirectUris.length === 0) {
    return registrationError(
      "invalid_redirect_uri",
      "At least one valid redirect URI is required."
    );
  }

  const grantTypes = Array.isArray(body?.grant_types)
    ? body.grant_types.filter(
        (value): value is string => typeof value === "string"
      )
    : ["authorization_code"];
  const responseTypes = Array.isArray(body?.response_types)
    ? body.response_types.filter(
        (value): value is string => typeof value === "string"
      )
    : ["code"];
  const tokenEndpointAuthMethod =
    typeof body?.token_endpoint_auth_method === "string"
      ? body.token_endpoint_auth_method
      : "none";

  if (
    tokenEndpointAuthMethod !== "none" ||
    !grantTypes.includes("authorization_code") ||
    !responseTypes.includes("code")
  ) {
    return registrationError(
      "invalid_client_metadata",
      "Only public authorization_code clients are supported."
    );
  }

  const scope = typeof body?.scope === "string" ? body.scope : "mcp:tools";
  const clientName =
    typeof body?.client_name === "string"
      ? body.client_name
      : "Hinear MCP Client";

  const clientId = buildMcpRegisteredClient({
    clientName,
    grantTypes: ["authorization_code"],
    redirectUris,
    responseTypes: ["code"],
    scope,
    tokenEndpointAuthMethod: "none",
  });

  return Response.json(
    {
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: clientName,
      grant_types: ["authorization_code"],
      redirect_uris: redirectUris,
      response_types: ["code"],
      scope,
      token_endpoint_auth_method: "none",
    },
    { status: 201 }
  );
}
