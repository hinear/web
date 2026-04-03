export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MCP_EXTERNAL_URL_REQUIRED =
  "HINEAR_MCP_EXTERNAL_URL is required. Set it to the URL of the standalone hinear-mcp service (e.g. http://127.0.0.1:3334/mcp).";

function getMcpProxyUrl(): string {
  const url = process.env.HINEAR_MCP_EXTERNAL_URL?.trim();

  if (!url) {
    throw new Error(MCP_EXTERNAL_URL_REQUIRED);
  }

  return url;
}

function createUpstreamRequest(request: Request, proxyBase: string): Request {
  const targetUrl = new URL(proxyBase);

  const originalUrl = new URL(request.url);
  for (const [key, value] of originalUrl.searchParams.entries()) {
    targetUrl.searchParams.set(key, value);
  }

  const headers = new Headers(request.headers);
  headers.set("Host", targetUrl.host);
  headers.delete("accept-encoding");

  return new Request(targetUrl, {
    method: request.method,
    headers,
    body: request.body,
    // @ts-expect-error - duplex is supported in Node.js
    duplex: "half",
  });
}

async function proxyRequest(request: Request) {
  const proxyUrl = getMcpProxyUrl();
  const upstreamRequest = createUpstreamRequest(request, proxyUrl);
  return fetch(upstreamRequest);
}

export async function POST(request: Request) {
  return proxyRequest(request);
}

export async function GET(request: Request) {
  return proxyRequest(request);
}

export async function DELETE(request: Request) {
  return proxyRequest(request);
}
