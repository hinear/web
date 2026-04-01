import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { addComment } from "../adapters/comments";
import { toTextContent } from "../lib/content";
import { addCommentInputSchema } from "../schemas/comment";

export function registerAddCommentTool(server: McpServer) {
  server.registerTool(
    "add_comment",
    {
      description: "Add a comment to a Hinear issue.",
      inputSchema: addCommentInputSchema,
    },
    async (input) => {
      const data = await addComment(input);

      return {
        content: toTextContent(data),
      };
    }
  );
}
