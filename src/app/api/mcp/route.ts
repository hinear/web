import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { buildMcpWwwAuthenticateHeader } from "@/features/mcp/lib/oauth";
import { getRequestOrigin } from "@/lib/request-origin";
import {
  type McpSession,
  resolveSessionFromInput,
  runWithMcpSession,
} from "../../../../mcp/hinear/src/lib/auth";
import { createServer } from "../../../../mcp/hinear/src/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim();

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(/\s+/, 2);

  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token.trim();
}

function createRequestSession(request: Request): McpSession {
  const accessToken = getBearerToken(request);
  const userId = request.headers.get("x-hinear-mcp-user-id")?.trim() || null;

  return {
    accessToken,
    userId,
  };
}

function methodNotAllowed() {
  return Response.json(
    {
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    },
    {
      headers: {
        Allow: "POST",
      },
      status: 405,
    }
  );
}

async function handleMcpRequest(request: Request) {
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined,
  });
  const server = createServer("streamable-http");

  await server.connect(transport);

  try {
    return await transport.handleRequest(request);
  } finally {
    await transport.close().catch(() => undefined);
    await server.close().catch(() => undefined);
  }
}

export async function POST(request: Request) {
  const resolvedSession = await resolveSessionFromInput(
    createRequestSession(request)
  );

  if (!resolvedSession.userId) {
    return Response.json(
      {
        error: "unauthorized",
      },
      {
        headers: {
          "WWW-Authenticate": buildMcpWwwAuthenticateHeader(
            await getRequestOrigin()
          ),
        },
        status: 401,
      }
    );
  }

  return runWithMcpSession(resolvedSession, () => handleMcpRequest(request));
}

export async function GET() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}
