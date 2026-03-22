import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { normalizeNextPath } from "@/features/auth/lib/next-path";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

function buildRedirectUrl(request: NextRequest, path: string): URL {
  return new URL(path, request.url);
}

export async function GET(request: NextRequest) {
  const { anonKey, url } = getSupabasePublicEnv();
  const next = normalizeNextPath(request.nextUrl.searchParams.get("next"), "/");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;

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
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
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
