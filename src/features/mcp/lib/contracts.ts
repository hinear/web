export interface McpAccessTokenSummary {
  created_at: string;
  expires_at: string | null;
  id: string;
  last_used_at: string | null;
  name: string;
  revoked_at: string | null;
}

export interface CreateMcpTokenResponse {
  token: string;
  tokenRecord: McpAccessTokenSummary;
}
