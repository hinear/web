import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { linkGitHubIssue } from "../adapters/github";
import { toTextContent } from "../lib/content";
import { linkGitHubIssueInputSchema } from "../schemas/github";

export function registerLinkGitHubIssueTool(server: McpServer) {
  server.registerTool(
    "link_github_issue",
    {
      description: "Link a Hinear issue to a GitHub issue.",
      inputSchema: linkGitHubIssueInputSchema,
    },
    async (input) => {
      const data = await linkGitHubIssue(input);
      return {
        content: toTextContent(data),
      };
    }
  );
}
