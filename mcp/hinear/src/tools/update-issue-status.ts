import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { updateIssueStatus } from "../adapters/issues";
import { toTextContent } from "../lib/content";
import { updateIssueStatusInputSchema } from "../schemas/issue";

export function registerUpdateIssueStatusTool(server: McpServer) {
  server.registerTool(
    "update_issue_status",
    {
      description:
        "Move a Hinear issue between states like triage, backlog, todo, in_progress, done, and canceled.",
      inputSchema: updateIssueStatusInputSchema,
    },
    async (input) => {
      const data = await updateIssueStatus(input);

      return {
        content: toTextContent(data),
      };
    }
  );
}
