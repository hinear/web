import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv, getSupabaseServiceRoleKey } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

export type AppSupabaseServerClient = SupabaseClient<Database>;

function createServerClient(apiKey: string, accessToken?: string): AppSupabaseServerClient {
  const { url } = getSupabasePublicEnv();

  return createClient<Database>(url, apiKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

export function createServerSupabaseClient(
  accessToken?: string,
): AppSupabaseServerClient {
  const { anonKey } = getSupabasePublicEnv();

  return createServerClient(anonKey, accessToken);
}

export function createServiceRoleSupabaseClient(): AppSupabaseServerClient {
  return createServerClient(getSupabaseServiceRoleKey());
}
