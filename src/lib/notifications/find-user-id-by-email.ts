import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server-client";

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("email_normalized", normalizedEmail)
    .maybeSingle();

  if (error) {
    console.error("Failed to resolve invited user by email:", error);
    return null;
  }

  return data?.id ?? null;
}
