import "server-only";

import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";

import {
  getSupabasePublicEnv,
  getSupabaseServiceRoleKey,
} from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

export type AppSupabaseServerClient = SupabaseClient<Database>;

/**
 * Create a Supabase client for Server Components, Server Actions, and Route Handlers.
 * Uses @supabase/ssr with cookie-based session management.
 */
export const createRequestSupabaseServerClient = cache(
  async function createRequestSupabaseServerClient(): Promise<AppSupabaseServerClient> {
    const cookieStore = await cookies();
    const { anonKey, url } = getSupabasePublicEnv();

    return createSsrServerClient<Database>(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, options, value } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components can't mutate cookies directly.
          }
        },
      },
    });
  }
);

/**
 * Create a Supabase client with service role privileges.
 * Bypasses Row Level Security. Use only for admin/system operations.
 */
/** @deprecated Use createRequestSupabaseServerClient instead */
export const createServerSupabaseClient = createRequestSupabaseServerClient;

export function createServiceRoleSupabaseClient(): AppSupabaseServerClient {
  const { url } = getSupabasePublicEnv();

  return createClient<Database>(url, getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
