import "server-only";

import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import {
  getSupabasePublicEnv,
  getSupabaseServiceRoleKey,
} from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

export type AppSupabaseServerClient = SupabaseClient<Database>;

function createApiKeyServerClient(
  apiKey: string,
  accessToken?: string
): AppSupabaseServerClient {
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
  accessToken?: string
): AppSupabaseServerClient {
  const { anonKey } = getSupabasePublicEnv();

  return createApiKeyServerClient(anonKey, accessToken);
}

export function createServiceRoleSupabaseClient(): AppSupabaseServerClient {
  return createApiKeyServerClient(getSupabaseServiceRoleKey());
}

export async function createRequestSupabaseServerClient(): Promise<AppSupabaseServerClient> {
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
