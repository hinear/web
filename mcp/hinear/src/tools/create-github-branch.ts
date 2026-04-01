import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createGitHubBranch } from "../adapters/github";
import { toTextContent } from "../lib/content";
import { createGitHubBranchInputSchema } from "../schemas/github";

export function registerCreateGitHubBranchTool(server: McpServer) {
  server.registerTool(
    "create_github_branch",
    {
      description:
        "Create a GitHub branch for a Hinear issue. Requires GITHUB_TOKEN environment variable.",
      inputSchema: createGitHubBranchInputSchema,
    },
    async (input) => {
      const data = await createGitHubBranch(input);
      return {
        content: toTextContent(data),
      };
    }
  );
}
