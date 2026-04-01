import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listMembers } from "../adapters/members";
import { toTextContent } from "../lib/content";
import { listMembersInputSchema } from "../schemas/member";

export function registerListMembersTool(server: McpServer) {
  server.registerTool(
    "list_members",
    {
      description: "List all members of a Hinear project with their roles.",
      inputSchema: listMembersInputSchema,
    },
    async (input) => {
      const data = await listMembers(input);
      return {
        content: toTextContent(data),
      };
    }
  );
}
