"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/atoms/Button";
import type {
  CreateMcpTokenResponse,
  McpAccessTokenSummary,
} from "@/features/mcp/lib/contracts";

interface McpTokenSettingsCardProps {
  appOrigin: string | null;
  initialTokens: McpAccessTokenSummary[];
}

type ExpiryOption = 30 | 90 | "never";

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function buildEnvSnippet(token: string) {
  return `HINEAR_MCP_ACCESS_TOKEN=${token}`;
}

function buildClaudeCommandSnippet(endpoint: string, token: string) {
  return `claude mcp add --transport http hinear ${endpoint} --header "Authorization: Bearer ${token}"`;
}

function buildOAuthClaudeCommand(appOrigin: string | null) {
  const endpoint = appOrigin
    ? `${appOrigin}/api/mcp`
    : "https://hinear.dev/api/mcp";
  return `claude mcp add hinear ${endpoint}`;
}

function buildCurlSnippet(endpoint: string, token: string) {
  return [
    `curl -X POST "${endpoint}" \\`,
    '  -H "Content-Type: application/json" \\',
    `  -H "Authorization: Bearer ${token}" \\`,
    '  -d \'{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}\'',
  ].join("\n");
}

export function McpTokenSettingsCard({
  appOrigin,
  initialTokens,
}: McpTokenSettingsCardProps) {
  const [tokens, setTokens] = useState(initialTokens);
  const [name, setName] = useState("My MCP token");
  const [expiresInDays, setExpiresInDays] = useState<ExpiryOption>(30);
  const [creating, setCreating] = useState(false);
  const [revokingTokenId, setRevokingTokenId] = useState<string | null>(null);
  const [createdToken, setCreatedToken] =
    useState<CreateMcpTokenResponse | null>(null);

  const activeTokens = useMemo(
    () => tokens.filter((token) => !token.revoked_at),
    [tokens]
  );
  const endpoint = appOrigin
    ? `${appOrigin}/api/mcp`
    : "https://YOUR-HINEAR-URL/api/mcp";

  async function copyText(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error("Clipboard access failed.");
    }
  }

  async function handleCreateToken() {
    setCreating(true);

    try {
      const response = await fetch("/api/mcp/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expiresInDays,
          name,
        }),
      });
      const data = (await response.json()) as
        | ({ success: true } & CreateMcpTokenResponse)
        | { error?: string; success: false };

      if (!response.ok || !data.success) {
        throw new Error(
          ("error" in data ? data.error : undefined) ??
            "Failed to create MCP token"
        );
      }

      setCreatedToken({
        token: data.token,
        tokenRecord: data.tokenRecord,
      });
      setTokens((current) => [data.tokenRecord, ...current]);
      toast.success("MCP token created.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create MCP token"
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleRevokeToken(tokenId: string) {
    setRevokingTokenId(tokenId);

    try {
      const response = await fetch(`/api/mcp/tokens/${tokenId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as
        | { success: true; tokenId: string }
        | { error?: string; success: false };

      if (!response.ok || !data.success) {
        throw new Error(
          ("error" in data ? data.error : undefined) ??
            "Failed to revoke MCP token"
        );
      }

      setTokens((current) =>
        current.map((token) =>
          token.id === tokenId
            ? { ...token, revoked_at: new Date().toISOString() }
            : token
        )
      );
      toast.success("MCP token revoked.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to revoke MCP token"
      );
    } finally {
      setRevokingTokenId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#FCFCFD]">
      <div className="app-mobile-page-shell mx-auto flex min-h-screen w-full max-w-[960px] flex-col gap-6 px-4 py-8 md:px-6">
        <div className="app-mobile-top-surface flex flex-col gap-2">
          <p className="text-[12px] leading-[12px] font-[var(--app-font-weight-600)] text-[#5E6AD2]">
            MCP Settings
          </p>
          <h1 className="font-display text-[30px] leading-[1.1] font-[var(--app-font-weight-700)] text-[#111318]">
            MCP access tokens
          </h1>
          <p className="max-w-[720px] text-[14px] leading-6 font-[var(--app-font-weight-500)] text-[#4B5563]">
            Create a token for Claude, Codex, or any MCP client. The raw token
            is shown only once right after creation.
          </p>
        </div>

        <section className="rounded-[24px] border border-[#E6E8EC] bg-white p-6">
          <div className="flex flex-col gap-5">
            <div className="rounded-[16px] border border-[#E6E8EC] bg-[#FCFCFD] p-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-[15px] font-semibold text-[#111318]">
                  MCP endpoint
                </h2>
                <p className="text-[13px] leading-6 text-[#6B7280]">
                  Use this URL in Claude, Codex, or any MCP client with
                  `Authorization: Bearer &lt;your token&gt;`.
                </p>
                <code className="block break-all text-[13px] leading-6 text-[#111318]">
                  {endpoint}
                </code>
              </div>
            </div>

            <div className="rounded-[16px] border border-[#E6E8EC] bg-[#F0F0FF] p-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-[15px] font-semibold text-[#5E6AD2]">
                  Quick connect (OAuth)
                </h3>
                <p className="text-[13px] leading-6 text-[#4B5563]">
                  No token needed. Copy this command and paste into your
                  terminal — Claude Code will open a browser for sign-in.
                </p>
                <div className="flex items-start justify-between gap-3 rounded-[12px] border border-[#D1D5DB] bg-white p-3">
                  <code className="min-w-0 break-all text-[12px] leading-5 text-[#111318]">
                    {buildOAuthClaudeCommand(appOrigin)}
                  </code>
                  <Button
                    onClick={() =>
                      copyText(
                        buildOAuthClaudeCommand(appOrigin),
                        "Command copied."
                      )
                    }
                    variant="secondary"
                    size="sm"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-[18px] font-bold text-[#111318]">
                Create token
              </h2>
              <p className="text-[13px] leading-6 text-[#6B7280]">
                For clients that don&apos;t support OAuth. Give the token a
                recognizable name and pick an expiration.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <label className="flex flex-col gap-2">
                <span className="text-[12px] font-semibold text-[#6B7280]">
                  Token name
                </span>
                <input
                  className="min-h-11 rounded-[14px] border border-[#E6E8EC] px-4 text-[14px] text-[#111318] outline-none focus:border-[#5E6AD2]"
                  maxLength={80}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="My MCP token"
                  value={name}
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[12px] font-semibold text-[#6B7280]">
                  Expires
                </span>
                <select
                  className="min-h-11 rounded-[14px] border border-[#E6E8EC] bg-white px-4 text-[14px] text-[#111318] outline-none focus:border-[#5E6AD2]"
                  onChange={(event) =>
                    setExpiresInDays(
                      event.target.value === "never"
                        ? "never"
                        : Number(event.target.value) === 90
                          ? 90
                          : 30
                    )
                  }
                  value={expiresInDays}
                >
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value="never">Never</option>
                </select>
              </label>
            </div>

            <div className="flex justify-end">
              <Button loading={creating} onClick={handleCreateToken} size="md">
                Create token
              </Button>
            </div>
          </div>
        </section>

        {createdToken ? (
          <section className="rounded-[24px] border border-[#BFDBFE] bg-[#EFF6FF] p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-[18px] font-bold text-[#1D4ED8]">
                  New token
                </h2>
                <p className="text-[13px] leading-6 text-[#1E40AF]">
                  Copy this now. You will not be able to see the raw value
                  again.
                </p>
              </div>

              <div className="rounded-[16px] border border-[#BFDBFE] bg-white p-4">
                <code className="block break-all text-[13px] leading-6 text-[#111318]">
                  {createdToken.token}
                </code>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() =>
                    copyText(createdToken.token, "MCP token copied.")
                  }
                  variant="primary"
                >
                  Copy token
                </Button>
                <Button
                  onClick={() =>
                    copyText(
                      buildEnvSnippet(createdToken.token),
                      ".env snippet copied."
                    )
                  }
                  variant="secondary"
                >
                  Copy .env snippet
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[16px] border border-[#BFDBFE] bg-white p-4">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-[14px] font-semibold text-[#111318]">
                      Claude Code
                    </h3>
                    <pre className="overflow-x-auto whitespace-pre-wrap break-all text-[12px] leading-5 text-[#111318]">
                      {buildClaudeCommandSnippet(endpoint, createdToken.token)}
                    </pre>
                    <Button
                      onClick={() =>
                        copyText(
                          buildClaudeCommandSnippet(
                            endpoint,
                            createdToken.token
                          ),
                          "Claude command copied."
                        )
                      }
                      variant="secondary"
                    >
                      Copy Claude command
                    </Button>
                  </div>
                </div>

                <div className="rounded-[16px] border border-[#BFDBFE] bg-white p-4">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-[14px] font-semibold text-[#111318]">
                      Test with curl
                    </h3>
                    <pre className="overflow-x-auto whitespace-pre-wrap break-all text-[12px] leading-5 text-[#111318]">
                      {buildCurlSnippet(endpoint, createdToken.token)}
                    </pre>
                    <Button
                      onClick={() =>
                        copyText(
                          buildCurlSnippet(endpoint, createdToken.token),
                          "curl example copied."
                        )
                      }
                      variant="secondary"
                    >
                      Copy curl example
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-[24px] border border-[#E6E8EC] bg-white p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-[18px] font-bold text-[#111318]">
                Active tokens
              </h2>
              <p className="text-[13px] leading-6 text-[#6B7280]">
                Revoke any token you no longer trust or need.
              </p>
            </div>

            {activeTokens.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-[#D1D5DB] bg-[#FCFCFD] p-5 text-[14px] text-[#6B7280]">
                No active MCP tokens yet.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeTokens.map((token) => (
                  <article
                    className="rounded-[16px] border border-[#E6E8EC] bg-[#FCFCFD] p-4"
                    key={token.id}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[15px] font-semibold text-[#111318]">
                            {token.name}
                          </h3>
                          <span className="rounded-full bg-[#DCFCE7] px-2 py-1 text-[11px] font-semibold text-[#166534]">
                            Active
                          </span>
                        </div>
                        <dl className="grid gap-1 text-[12px] text-[#6B7280]">
                          <div>
                            Created: {formatTimestamp(token.created_at)}
                          </div>
                          <div>
                            Last used: {formatTimestamp(token.last_used_at)}
                          </div>
                          <div>
                            Expires: {formatTimestamp(token.expires_at)}
                          </div>
                        </dl>
                      </div>

                      <Button
                        loading={revokingTokenId === token.id}
                        onClick={() => handleRevokeToken(token.id)}
                        variant="secondary"
                      >
                        Revoke
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
