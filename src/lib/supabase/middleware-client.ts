import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Create a Supabase client for Next.js middleware (Edge Runtime).
 * Handles cookie-based session reading and token refresh.
 */
export function createMiddlewareSupabaseClient(request: NextRequest) {
  const { anonKey, url } = getSupabasePublicEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  return { response, supabase };
}

/**
 * Create a redirect response that preserves any cookie updates from Supabase
 * (e.g. token refreshes).
 */
export function redirectWithCookies(
  url: URL,
  cookieSource: NextResponse
): NextResponse {
  const redirect = NextResponse.redirect(url);
  for (const { name, value } of cookieSource.cookies.getAll()) {
    redirect.cookies.set(name, value);
  }
  return redirect;
}
