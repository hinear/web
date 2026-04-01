import { createHmac, timingSafeEqual } from "node:crypto";

import { getSupabaseServiceRoleKey } from "@/lib/supabase/env";

interface AuthorizationCodePayload {
  clientId: string;
  codeChallenge: string;
  expiresAt: number;
  redirectUri: string;
  resource?: string;
  scope?: string;
  userId: string;
}

interface RegisteredClientPayload {
  clientName?: string;
  expiresAt?: number;
  grantTypes: string[];
  redirectUris: string[];
  responseTypes: string[];
  scope?: string;
  tokenEndpointAuthMethod: string;
}

function toBase64Url(value: Buffer | string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url");
}

function createSignature(value: string) {
  return toBase64Url(
    createHmac("sha256", getSupabaseServiceRoleKey()).update(value).digest()
  );
}

function encodePayload(payload: AuthorizationCodePayload) {
  const body = toBase64Url(JSON.stringify(payload));
  const signature = createSignature(body);
  return `${body}.${signature}`;
}

function decodePayload(code: string): AuthorizationCodePayload | null {
  const [body, signature] = code.split(".", 2);

  if (!body || !signature) {
    return null;
  }

  const expectedSignature = createSignature(body);

  if (
    signature.length !== expectedSignature.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      fromBase64Url(body).toString("utf8")
    ) as AuthorizationCodePayload;

    if (payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function encodeRegisteredClientPayload(payload: RegisteredClientPayload) {
  const body = toBase64Url(JSON.stringify(payload));
  const signature = createSignature(body);
  return `${body}.${signature}`;
}

function decodeRegisteredClientPayload(
  clientId: string
): RegisteredClientPayload | null {
  const value = clientId.startsWith("hinear-oauth-client.")
    ? clientId.slice("hinear-oauth-client.".length)
    : clientId;
  const [body, signature] = value.split(".", 2);

  if (!body || !signature) {
    return null;
  }

  const expectedSignature = createSignature(body);

  if (
    signature.length !== expectedSignature.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      fromBase64Url(body).toString("utf8")
    ) as RegisteredClientPayload;

    if (payload.expiresAt && payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function buildMcpAuthorizationCode(
  payload: Omit<AuthorizationCodePayload, "expiresAt">
) {
  return encodePayload({
    ...payload,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
}

export function readMcpAuthorizationCode(code: string) {
  return decodePayload(code);
}

export async function verifyPkceChallenge(
  codeVerifier: string,
  expectedChallenge: string
) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier)
  );
  const actualChallenge = toBase64Url(Buffer.from(digest));

  return actualChallenge === expectedChallenge;
}

export function buildMcpRegisteredClient(
  payload: Omit<RegisteredClientPayload, "expiresAt">
) {
  const token = encodeRegisteredClientPayload({
    ...payload,
    expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
  });

  return `hinear-oauth-client.${token}`;
}

export function readMcpRegisteredClient(clientId: string) {
  return decodeRegisteredClientPayload(clientId);
}

export function getMcpAuthorizationServerOrigin(appOrigin: string) {
  return appOrigin;
}

export function getMcpTokenEndpoint(appOrigin: string) {
  return new URL("/api/mcp/oauth/token", appOrigin).toString();
}

export function getMcpAuthorizationEndpoint(appOrigin: string) {
  return new URL("/api/mcp/oauth/authorize", appOrigin).toString();
}

export function getMcpRegistrationEndpoint(appOrigin: string) {
  return new URL("/api/mcp/oauth/register", appOrigin).toString();
}

export function getMcpProtectedResourceMetadataUrl(appOrigin: string) {
  return new URL(
    "/.well-known/oauth-protected-resource/api/mcp",
    appOrigin
  ).toString();
}

export function buildMcpWwwAuthenticateHeader(appOrigin: string) {
  return `Bearer error="invalid_token", error_description="Authentication required", scope="mcp:tools", resource_metadata="${getMcpProtectedResourceMetadataUrl(appOrigin)}"`;
}

export function buildMcpAuthorizationServerMetadata(appOrigin: string) {
  const issuer = getMcpAuthorizationServerOrigin(appOrigin);

  return {
    authorization_endpoint: getMcpAuthorizationEndpoint(appOrigin),
    code_challenge_methods_supported: ["S256"],
    grant_types_supported: ["authorization_code"],
    issuer,
    registration_endpoint: getMcpRegistrationEndpoint(appOrigin),
    response_types_supported: ["code"],
    scopes_supported: ["mcp:tools"],
    token_endpoint: getMcpTokenEndpoint(appOrigin),
    token_endpoint_auth_methods_supported: ["none"],
  };
}

export function buildMcpProtectedResourceMetadata(appOrigin: string) {
  return {
    authorization_servers: [getMcpAuthorizationServerOrigin(appOrigin)],
    bearer_methods_supported: ["header"],
    resource: new URL("/api/mcp", appOrigin).toString(),
    resource_name: "Hinear MCP",
    scopes_supported: ["mcp:tools"],
  };
}

export function isAllowedRedirectUri(value: string) {
  try {
    const url = new URL(value);

    if (["http:", "https:"].includes(url.protocol)) {
      if (
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname === "[::1]"
      ) {
        return true;
      }

      return url.protocol === "https:";
    }

    return true;
  } catch {
    return false;
  }
}

export function isValidRegisteredClient(
  clientId: string,
  redirectUri?: string | null
) {
  const payload = readMcpRegisteredClient(clientId);

  if (!payload) {
    return false;
  }

  if (
    payload.tokenEndpointAuthMethod !== "none" ||
    !payload.grantTypes.includes("authorization_code") ||
    !payload.responseTypes.includes("code")
  ) {
    return false;
  }

  if (redirectUri && !payload.redirectUris.includes(redirectUri)) {
    return false;
  }

  return true;
}
