import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createLabel } from "../adapters/labels";
import { toTextContent } from "../lib/content";
import { createLabelInputSchema } from "../schemas/label";

export function registerCreateLabelTool(server: McpServer) {
  server.registerTool(
    "create_label",
    {
      description:
        "Create a new label for a Hinear project. Labels help categorize and organize issues.",
      inputSchema: createLabelInputSchema,
    },
    async (input) => {
      const data = await createLabel(input);

      return {
        content: toTextContent(data),
      };
    }
  );
}
