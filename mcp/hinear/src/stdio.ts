import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { initializeDefaultSession } from "./lib/auth";
import { createServer } from "./server";

async function startStdioServer() {
  await initializeDefaultSession();
  const server = createServer("stdio");
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

void startStdioServer();
