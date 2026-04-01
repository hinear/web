import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { inviteMember } from "../adapters/members";
import { toTextContent } from "../lib/content";
import { inviteMemberInputSchema } from "../schemas/member";

export function registerInviteMemberTool(server: McpServer) {
  server.registerTool(
    "invite_member",
    {
      description:
        "Invite a new member to a Hinear project with a specified role (owner or member).",
      inputSchema: inviteMemberInputSchema,
    },
    async (input) => {
      const data = await inviteMember(input);
      return {
        content: toTextContent(data),
      };
    }
  );
}
