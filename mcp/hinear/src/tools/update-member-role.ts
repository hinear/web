import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { updateMemberRole } from "../adapters/members";
import { toTextContent } from "../lib/content";
import { updateMemberRoleInputSchema } from "../schemas/member";

export function registerUpdateMemberRoleTool(server: McpServer) {
  server.registerTool(
    "update_member_role",
    {
      description: "Update a project member's role (owner or member).",
      inputSchema: updateMemberRoleInputSchema,
    },
    async (input) => {
      const data = await updateMemberRole(input);
      return {
        content: toTextContent(data),
      };
    }
  );
}
