import { createHash, randomBytes } from "node:crypto";

const PREFIX = "hinear_mcp_";

export type McpTokenExpiryOption = 30 | 90 | "never";

export function generateMcpAccessToken() {
  return `${PREFIX}${randomBytes(24).toString("base64url")}`;
}

export function hashMcpAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function resolveMcpTokenExpiryDate(option: McpTokenExpiryOption) {
  if (option === "never") {
    return null;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + option);
  return expiresAt.toISOString();
}
