import { type NextRequest, NextResponse } from "next/server";

import {
  createMiddlewareSupabaseClient,
  redirectWithCookies,
} from "@/lib/supabase/middleware-client";

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle root path: auth check + direct redirect to user's project
  if (pathname === "/") {
    const { supabase, response } = createMiddlewareSupabaseClient(request);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return redirectWithCookies(new URL("/auth", request.url), response);
    }

    const { data } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const targetPath = data?.project_id
      ? `/projects/${data.project_id}/overview`
      : "/projects/new";

    return redirectWithCookies(new URL(targetPath, request.url), response);
  }

  // Only apply CORS to OAuth and well-known routes
  const isOAuthRoute =
    pathname.startsWith("/api/mcp/oauth") ||
    pathname.startsWith("/.well-known/");

  if (!isOAuthRoute) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin") ?? undefined;

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    const resp = new NextResponse(null, { status: 204 });

    if (origin && isAllowedOrigin(origin)) {
      resp.headers.set("Access-Control-Allow-Origin", origin);
      for (const [key, value] of Object.entries(CORS_HEADERS)) {
        resp.headers.set(key, value);
      }
    }

    return resp;
  }

  // Forward request with CORS headers
  const resp = NextResponse.next();

  if (origin && isAllowedOrigin(origin)) {
    resp.headers.set("Access-Control-Allow-Origin", origin);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      resp.headers.set(key, value);
    }
  }

  return resp;
}

export const config = {
  matcher: ["/", "/api/mcp/oauth/:path*", "/.well-known/:path*"],
};
