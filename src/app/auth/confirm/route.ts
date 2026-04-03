import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { normalizeNextPath } from "@/features/auth/lib/next-path";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

function buildRedirectUrl(request: NextRequest, path: string): URL {
  return new URL(path, request.url);
}

function withGitHubState(path: string, state: string): string {
  const url = new URL(path, "http://localhost");
  url.searchParams.set("github", state);

  const search = url.searchParams.toString();
  return `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
}

export async function GET(request: NextRequest) {
  const { anonKey, url } = getSupabasePublicEnv();
  const next = normalizeNextPath(request.nextUrl.searchParams.get("next"), "/");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as
    | "signup"
    | "invite"
    | "magiclink"
    | "recovery"
    | "email_change"
    | "email"
    | null;

  const response = NextResponse.redirect(buildRedirectUrl(request, next));

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        for (const { name, options, value } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return response;
    }
  }

  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Extract GitHub access token if this was a GitHub OAuth flow
      const githubProjectId =
        request.nextUrl.searchParams.get("github_project_id");

      if (githubProjectId && data.session?.provider_token) {
        // Store the token temporarily for the GitHub integration flow
        // This will be picked up by the GitHub integration callback
        response.cookies.set("github_token_temp", data.session.provider_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 300, // 5 minutes to complete the flow
        });
        response.cookies.set("github_project_temp", githubProjectId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 300,
        });
      } else if (githubProjectId) {
        // In some provider misconfiguration cases, session is created but provider_token is missing.
        console.warn(
          "[auth/confirm] GitHub OAuth completed without provider_token.",
          {
            hasSession: Boolean(data.session),
            provider: data.session?.user?.app_metadata?.provider ?? null,
            githubProjectId,
          }
        );
        return NextResponse.redirect(
          buildRedirectUrl(request, withGitHubState(next, "oauth-error"))
        );
      }

      return response;
    }
  }

  return NextResponse.redirect(
    buildRedirectUrl(
      request,
      `/auth?error=${encodeURIComponent("Login failed. Please request a new magic link.")}&next=${encodeURIComponent(next)}`
    )
  );
}
