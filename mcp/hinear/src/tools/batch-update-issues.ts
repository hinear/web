import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { batchUpdateIssues } from "../adapters/batch";
import { toTextContent } from "../lib/content";
import { batchUpdateIssuesInputSchema } from "../schemas/batch";

export function registerBatchUpdateIssuesTool(server: McpServer) {
  server.registerTool(
    "batch_update_issues",
    {
      description:
        "Update multiple Hinear issues at once. Supports batch status changes, priority updates, and assignee changes. Returns individual results for each issue.",
      inputSchema: batchUpdateIssuesInputSchema,
    },
    async (input) => {
      const data = await batchUpdateIssues(input);

      return {
        content: toTextContent(data),
      };
    }
  );
}
