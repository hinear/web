import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { deleteLabel } from "../adapters/labels";
import { toTextContent } from "../lib/content";
import { deleteLabelInputSchema } from "../schemas/label";

export function registerDeleteLabelTool(server: McpServer) {
  server.registerTool(
    "delete_label",
    {
      description: "Delete a label from a Hinear project.",
      inputSchema: deleteLabelInputSchema,
    },
    async (input) => {
      const data = await deleteLabel(input);

      return {
        content: toTextContent(data),
      };
    }
  );
}
