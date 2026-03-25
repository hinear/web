import "server-only";

import { createSign } from "node:crypto";

import { GitHubApiClient } from "@/lib/github/api-client";

interface GitHubAppCredentials {
  appId: string;
  privateKey: string;
}

interface GitHubInstallationTokenResponse {
  token: string;
}

interface GitHubRepositoryInstallation {
  id: number;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function normalizeGitHubAppPrivateKey(value: string): string {
  const trimmed = value.trim();

  if (trimmed.includes("-----BEGIN")) {
    return trimmed.replace(/\\n/g, "\n");
  }

  // Support base64-encoded private key env values.
  const decoded = Buffer.from(trimmed, "base64").toString("utf-8").trim();
  return decoded.replace(/\\n/g, "\n");
}

function getGitHubAppCredentials(): GitHubAppCredentials | null {
  const appId = process.env.GITHUB_APP_ID?.trim();
  const privateKeyRaw = process.env.GITHUB_APP_PRIVATE_KEY?.trim();

  if (!appId || !privateKeyRaw) {
    return null;
  }

  return {
    appId,
    privateKey: normalizeGitHubAppPrivateKey(privateKeyRaw),
  };
}

export function isGitHubAppConfigured(): boolean {
  return Boolean(getGitHubAppCredentials());
}

function createGitHubAppJwt(credentials: GitHubAppCredentials): string {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const payload = {
    iat: now - 60,
    exp: now + 9 * 60,
    iss: credentials.appId,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();

  const signature = signer
    .sign(credentials.privateKey, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${unsignedToken}.${signature}`;
}

async function githubAppFetch<T>(
  endpoint: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub App API error: ${response.status} ${body}`);
  }

  return response.json();
}

export async function createGitHubInstallationClientForRepository(
  owner: string,
  name: string
): Promise<GitHubApiClient | null> {
  const credentials = getGitHubAppCredentials();

  if (!credentials) {
    return null;
  }

  const appJwt = createGitHubAppJwt(credentials);

  const installation = await githubAppFetch<GitHubRepositoryInstallation>(
    `/repos/${owner}/${name}/installation`,
    appJwt
  );

  const installationToken =
    await githubAppFetch<GitHubInstallationTokenResponse>(
      `/app/installations/${installation.id}/access_tokens`,
      appJwt,
      { method: "POST" }
    );

  return new GitHubApiClient(installationToken.token);
}
