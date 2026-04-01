import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { McpSession } from "./auth";
import { readEnv } from "./env";

export type McpSupabaseClient = SupabaseClient;

export function createMcpSupabaseClient(
  accessToken?: string
): McpSupabaseClient {
  const env = readEnv();

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error(
      "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
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

export function createMcpServiceRoleSupabaseClient(): McpSupabaseClient {
  const env = readEnv();

  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase service role configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createMcpActorSupabaseClient(
  session: McpSession
): McpSupabaseClient {
  if (session.accessToken) {
    return createMcpSupabaseClient(session.accessToken);
  }

  if (session.userId) {
    return createMcpServiceRoleSupabaseClient();
  }

  return createMcpSupabaseClient();
}
