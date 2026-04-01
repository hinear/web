import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { removeMember } from "../adapters/members";
import { toTextContent } from "../lib/content";
import { removeMemberInputSchema } from "../schemas/member";

export function registerRemoveMemberTool(server: McpServer) {
  server.registerTool(
    "remove_member",
    {
      description:
        "Remove a member from a Hinear project or revoke a pending invitation.",
      inputSchema: removeMemberInputSchema,
    },
    async (input) => {
      const data = await removeMember(input);
      return {
        content: toTextContent(data),
      };
    }
  );
}
