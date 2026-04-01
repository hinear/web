import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listProjects } from "../adapters/projects";
import { toTextContent } from "../lib/content";
import { listProjectsInputSchema } from "../schemas/project";

export function registerListProjectsTool(server: McpServer) {
  server.registerTool(
    "list_projects",
    {
      description: "List Hinear projects the current user can access.",
      inputSchema: listProjectsInputSchema,
    },
    async (input) => {
      const data = await listProjects(input);

      return {
        content: toTextContent(data),
      };
    }
  );
}
