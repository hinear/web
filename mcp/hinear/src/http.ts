import { randomUUID } from "node:crypto";
import {
  createServer as createHttpServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import process from "node:process";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { initializeDefaultSession } from "./lib/auth";
import { createServer } from "./server";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3334;
const DEFAULT_PATH = "/mcp";

type TransportMap = Record<string, StreamableHTTPServerTransport>;

function readHost() {
  return process.env.HINEAR_MCP_HOST?.trim() || DEFAULT_HOST;
}

function readPort() {
  const value = Number.parseInt(process.env.HINEAR_MCP_PORT ?? "", 10);
  return Number.isFinite(value) ? value : DEFAULT_PORT;
}

function readPath() {
  const value = process.env.HINEAR_MCP_PATH?.trim();
  return value?.startsWith("/") ? value : DEFAULT_PATH;
}

async function readJsonBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return undefined;
  }

  const body = Buffer.concat(chunks).toString("utf8").trim();

  if (!body) {
    return undefined;
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error(
      `Invalid JSON request body: ${
        error instanceof Error ? error.message : "unknown parse error"
      }`
    );
  }
}

function writeJsonError(
  response: ServerResponse<IncomingMessage>,
  statusCode: number,
  message: string
) {
  if (response.headersSent) {
    return;
  }

  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json");
  response.end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message,
      },
      id: null,
    })
  );
}

export async function startHttpServer() {
  await initializeDefaultSession();
  const host = readHost();
  const port = readPort();
  const endpointPath = readPath();
  const transports: TransportMap = {};

  const server = createHttpServer(async (request, response) => {
    const url = new URL(request.url ?? "/", `http://${host}:${port}`);

    if (url.pathname === "/health") {
      response.statusCode = 200;
      response.setHeader("content-type", "application/json");
      response.end(
        JSON.stringify({
          ok: true,
          endpoint: endpointPath,
          host,
          port,
        })
      );
      return;
    }

    if (url.pathname !== endpointPath) {
      response.statusCode = 404;
      response.end("Not Found");
      return;
    }

    const sessionIdHeader = request.headers["mcp-session-id"];
    const sessionId =
      typeof sessionIdHeader === "string" ? sessionIdHeader : undefined;

    try {
      if (request.method === "POST") {
        const body = await readJsonBody(request);

        let transport: StreamableHTTPServerTransport | undefined = sessionId
          ? transports[sessionId]
          : undefined;

        if (!transport) {
          if (sessionId || !isInitializeRequest(body)) {
            writeJsonError(
              response,
              400,
              "Bad Request: No valid session ID provided"
            );
            return;
          }

          let initializedTransport: StreamableHTTPServerTransport | null = null;

          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (initializedSessionId) => {
              if (initializedTransport) {
                transports[initializedSessionId] = initializedTransport;
              }
            },
          });
          initializedTransport = transport;

          transport.onclose = () => {
            const activeSessionId = transport?.sessionId;

            if (activeSessionId) {
              delete transports[activeSessionId];
            }
          };

          await createServer("streamable-http").connect(transport);
        }

        await transport.handleRequest(request, response, body);
        return;
      }

      if (request.method === "GET") {
        if (!sessionId || !transports[sessionId]) {
          response.statusCode = 400;
          response.end("Invalid or missing session ID");
          return;
        }

        await transports[sessionId].handleRequest(request, response);
        return;
      }

      if (request.method === "DELETE") {
        if (!sessionId || !transports[sessionId]) {
          response.statusCode = 400;
          response.end("Invalid or missing session ID");
          return;
        }

        await transports[sessionId].handleRequest(request, response);
        return;
      }

      response.statusCode = 405;
      response.setHeader("allow", "GET, POST, DELETE");
      response.end("Method Not Allowed");
    } catch (error) {
      console.error("Error handling MCP request:", error);
      writeJsonError(response, 500, "Internal server error");
    }
  });

  server.listen(port, host, () => {
    console.log(
      `Hinear MCP Streamable HTTP server listening on http://${host}:${port}${endpointPath}`
    );
  });

  const shutdown = async () => {
    for (const transport of Object.values(transports)) {
      await transport.close().catch((error) => {
        console.error("Error closing transport:", error);
      });
    }

    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGINT", () => {
    void shutdown();
  });

  process.on("SIGTERM", () => {
    void shutdown();
  });
}
