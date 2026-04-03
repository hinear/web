import { type NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "https://claude.ai",
  "https://mcp.hinear.dev",
  "http://localhost:3334",
  "http://127.0.0.1:3334",
];

const ALLOWED_ORIGIN_PATTERNS = [
  /\.up\.railway\.app$/, // Railway default domains
  /\.railway\.app$/,
];

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin") ?? undefined;

  // Only apply CORS to OAuth and well-known routes
  const isOAuthRoute =
    pathname.startsWith("/api/mcp/oauth") ||
    pathname.startsWith("/.well-known/");

  if (!isOAuthRoute) {
    return NextResponse.next();
  }

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });

    if (origin && isAllowedOrigin(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      for (const [key, value] of Object.entries(CORS_HEADERS)) {
        response.headers.set(key, value);
      }
    }

    return response;
  }

  // Forward request with CORS headers
  const response = NextResponse.next();

  if (origin && isAllowedOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.headers.set(key, value);
    }
  }

  return response;
}

export const config = {
  matcher: ["/api/mcp/oauth/:path*", "/.well-known/:path*"],
};
