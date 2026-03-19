import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

export type AppSupabaseClient = SupabaseClient<Database>;

export function createBrowserSupabaseClient(): AppSupabaseClient {
  const { url, anonKey } = getSupabasePublicEnv();

  return createClient<Database>(url, anonKey);
}
