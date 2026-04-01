import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getIssueDetail } from "../adapters/issues";
import { toTextContent } from "../lib/content";
import { getIssueDetailInputSchema } from "../schemas/issue";

export function registerGetIssueDetailTool(server: McpServer) {
  server.registerTool(
    "get_issue_detail",
    {
      description:
        "Get a Hinear issue with description, labels, recent comments, and recent activity.",
      inputSchema: getIssueDetailInputSchema,
    },
    async (input) => {
      const data = await getIssueDetail(input);

      return {
        content: toTextContent(data),
      };
    }
  );
}
